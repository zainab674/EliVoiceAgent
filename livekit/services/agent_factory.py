"""
Agent factory for creating and configuring LiveKit agents.
"""

import os
import json
import asyncio
import datetime
import logging
from typing import Dict, Any, Optional
from zoneinfo import ZoneInfo

from livekit.agents import Agent
from services.unified_agent import UnifiedAgent
from integrations.calendar_api import CalComCalendar
from config.settings import validate_model_names
from utils.instruction_builder import build_call_management_instructions, build_analysis_instructions

logger = logging.getLogger(__name__)

# Global OpenAI client for field classification
_OPENAI_CLIENT = None

def get_openai_client():
    """Get or create OpenAI client for field classification."""
    global _OPENAI_CLIENT
    if _OPENAI_CLIENT is None:
        from openai import AsyncOpenAI
        _OPENAI_CLIENT = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _OPENAI_CLIENT


class AgentFactory:
    """Factory for creating and configuring agents."""
    
    def __init__(self, prewarmed_llms=None, prewarmed_tts=None, prewarmed_vad=None):
        self._prewarmed_llms = prewarmed_llms or {}
        self._prewarmed_tts = prewarmed_tts or {}
        self._prewarmed_vad = prewarmed_vad
    
    async def _classify_data_fields_with_llm(self, structured_data: list) -> Dict[str, list]:
        """Use LLM to classify which fields should be asked vs extracted."""
        try:
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if not openai_api_key:
                logger.warning("OPENAI_API_KEY not configured for field classification")
                return {"ask_user": [], "extract_from_conversation": []}

            client = get_openai_client()
            
            # Prepare field descriptions
            fields_json = json.dumps([
                {
                    "name": field.get("name", ""),
                    "description": field.get("description", ""),
                    "type": field.get("type", "string")
                }
                for field in structured_data
            ], indent=2)
            
            classification_prompt = f"""You are analyzing data fields for a voice conversation system. For each field, decide whether it should be:
1. "ask_user" - Information that should be directly asked from the user during the conversation
2. "extract_from_conversation" - Information that should be extracted/inferred from the conversation after it ends

Fields to classify:
{fields_json}

Guidelines:
- Ask user for: contact details, preferences, specific choices, personal information, scheduling details, specific business questions (e.g. current methods, pain points, business type)
- Extract from conversation: summaries, outcomes, sentiment, quality metrics, call analysis, high-level key points

Return a JSON object with two arrays. You must respond with valid JSON format only:
{{
  "ask_user": ["field_name1", "field_name2"],
  "extract_from_conversation": ["field_name3", "field_name4"]
}}"""

            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": classification_prompt}],
                    temperature=0.1,
                    max_tokens=1000
                ),
                timeout=10.0
            )
            
            content = response.choices[0].message.content.strip()
            logger.info(f"FIELD_CLASSIFICATION_RESPONSE | response={content}")
            
            # Parse JSON response
            try:
                classification = json.loads(content)
                logger.info(f"FIELD_CLASSIFICATION_SUCCESS | ask_user={len(classification.get('ask_user', []))} | extract={len(classification.get('extract_from_conversation', []))}")
                return classification
            except json.JSONDecodeError as e:
                logger.error(f"FIELD_CLASSIFICATION_JSON_ERROR | error={str(e)} | content={content}")
                # Fallback to asking user for all fields
                return {
                    "ask_user": [field.get("name", "") for field in structured_data],
                    "extract_from_conversation": []
                }
                
        except Exception as e:
            logger.error(f"FIELD_CLASSIFICATION_ERROR | error={str(e)}")
            # Fallback to asking user for all fields
            return {
                "ask_user": [field.get("name", "") for field in structured_data],
                "extract_from_conversation": []
            }

    async def create_agent(self, config: Dict[str, Any]) -> Agent:

        """Create appropriate agent based on configuration."""
        # Validate model names first
        config = validate_model_names(config)
        
        instructions = config.get("prompt", "You are a helpful assistant.")

        # Add date context only if calendar is configured
        cal_api_key = config.get('cal_api_key')
        cal_event_type_id = config.get('cal_event_type_id')
        if cal_api_key and cal_event_type_id:
            tz_name = (config.get("cal_timezone") or "Asia/Karachi")
            try:
                now_local = datetime.datetime.now(ZoneInfo(tz_name))
            except Exception as e:
                logger.warning(f"Invalid timezone '{tz_name}': {str(e)}, falling back to UTC")
                tz_name = "UTC"
                now_local = datetime.datetime.now(ZoneInfo(tz_name))
            instructions += (
                f"\n\nCONTEXT:\n"
                f"- Current local time: {now_local.isoformat()}\n"
                f"- Timezone: {tz_name}\n"
                f"- When the user says a date like '7th October', always interpret it as the next FUTURE occurrence in {tz_name}. "
                f"Never call tools with past dates; if a parsed date is in the past year, bump it to the next year."
            )

        # Add call management settings to instructions
        call_management_config = build_call_management_instructions(config)
        if call_management_config:
            instructions += "\n\n" + call_management_config

        # Add analysis instructions for structured data collection
        # Pass self._classify_data_fields_with_llm as the classifier function
        analysis_instructions = await build_analysis_instructions(config, self._classify_data_fields_with_llm)
        if analysis_instructions:
            instructions += "\n\n" + analysis_instructions
            logger.info(f"ANALYSIS_INSTRUCTIONS_ADDED | length={len(analysis_instructions)}")

        # Add first message handling
        first_message = config.get("first_message", "")
        force_first = os.getenv("FORCE_FIRST_MESSAGE", "true").lower() != "false"
        if force_first and first_message:
            instructions += f' IMPORTANT: Start the conversation by saying exactly: "{first_message}" Do not repeat or modify this greeting.'
            logger.info(f"FIRST_MESSAGE_SET | first_message={first_message}")

        # Log final instructions for debugging
        # logger.info(f"FINAL_INSTRUCTIONS_LENGTH | length={len(instructions)}")
        # logger.info(f"FINAL_INSTRUCTIONS_PREVIEW | preview={instructions}...")

       
        
        # Initialize calendar if credentials are available
        calendar = await self._initialize_calendar(config)

      

        # Add data collection instructions
        instructions += "\n\nDATA COLLECTION TOOLS:\nYou have access to tools for collecting customer information. YOU MUST use these tools when the user provides this information or when you collect it:\n- set_name: Set the customer's name\n- set_email: Set the customer's email\n- set_phone: Set the customer's phone number\n- set_notes: Set notes or summary of the conversation"
        
        # Add email collection instructions for letter-by-letter spelling
        instructions += "\n\nEMAIL COLLECTION PROTOCOL:\nWhen collecting email addresses, follow this EXACT protocol to ensure accuracy:\n1. Ask the user to spell their email address LETTER BY LETTER\n2. Say: 'Please spell your email address letter by letter.'\n3. Listen carefully as they spell each letter\n4. For special characters, listen for:\n   - 'at' or 'at sign' or '@' for the @ symbol\n   - 'dot' or 'period' or '.' for periods\n   - 'underscore' or 'dash' or 'hyphen' for _ or -\n5. After receiving the spelled email, ALWAYS repeat it back to confirm: 'Let me confirm, your email is [email]? Is that correct?'\n6. Wait for confirmation before calling set_email\n7. If the user says it's incorrect, ask them to spell it again letter by letter\n8. Only call set_email() after the user confirms the email is correct"

        if calendar:
            instructions += "\n\nBOOKING CAPABILITIES:\nYou can help users book appointments. You have access to the following booking tools:\n- list_slots_on_day: Show available appointment slots for a specific day (shows 10 slots by default - use max_options=20 to show more)\n- choose_slot: Select a time slot for the appointment (can use time like '7:00pm' or slot number from list)\n- finalize_booking: Complete the booking when ALL information is collected (time slot, name, email, phone)\n\nCRITICAL BOOKING RULES:\n- ONLY start booking if the user explicitly requests it (e.g., 'I want to book', 'schedule an appointment', 'book a time')\n- Do NOT automatically start booking just because you have contact information (phone, email, name)\n- Do NOT call list_slots_on_day or any booking tools unless the user explicitly asks to book or schedule an appointment\n- Do NOT call finalize_booking or confirm_details until you have: 1) selected time slot, 2) customer name, 3) email, and 4) phone number. Only call ONE of these functions, not both."
            logger.info("BOOKING_TOOLS | Calendar booking tools added to instructions")
        else:
            instructions += "\n\nBOOKING UNAVAILABLE:\nYou do NOT have access to a calendar or booking system. If the user asks to book an appointment or schedule a time, you must politely decline and explain that you don't have access to booking capabilities at the moment. You can offer to take their contact information (Name, Email, Phone) so someone can get back to them."
            logger.info("BOOKING_TOOLS | Booking unavailable - added explicit decline instructions")

        # Create unified agent with both RAG and booking capabilities
        # Use pre-warmed components if available
        llm_provider = config.get("llm_provider_setting", "OpenAI")
        llm_model = config.get("llm_model_setting", "gpt-4o-mini")
        config_key = f"{llm_provider}_{llm_model}"
        
        prewarmed_llm = self._prewarmed_llms.get(config_key)
        prewarmed_tts = self._prewarmed_tts.get("openai_nova")
        prewarmed_vad = self._prewarmed_vad
        
        agent = UnifiedAgent(
            instructions=instructions,
            calendar=calendar,
            company_id=config.get("id"),
            prewarmed_llm=prewarmed_llm,
            prewarmed_tts=prewarmed_tts,
            prewarmed_vad=prewarmed_vad
        )
        
        # Configure Call Transfer
        if config.get("advancedSettings", {}).get("transferEnabled") or config.get("transfer_enabled"):
            # Handle both nested advancedSettings and flat config (backwards compatibility)
            transfer_config = {
                "transfer_enabled": True,
                "transfer_phone_number": config.get("advancedSettings", {}).get("transferPhoneNumber") or config.get("transfer_phone_number"),
                "transfer_country_code": config.get("advancedSettings", {}).get("transferCountryCode") or config.get("transfer_country_code", "+1"),
                "transfer_sentence": config.get("advancedSettings", {}).get("transferSentence") or config.get("transfer_sentence"),
                "transfer_condition": config.get("advancedSettings", {}).get("transferCondition") or config.get("transfer_condition")
            }
            agent.set_transfer_config(transfer_config)

        # Configure Analysis Fields (metadata only, instructions already handled by build_analysis_instructions)
        analysis_settings = config.get("analysisSettings", {})
        structured_data = analysis_settings.get("structuredData", [])
        
        if structured_data:
            # Set fields on agent for reference
            agent.set_analysis_fields(structured_data)
        
        return agent

    async def _initialize_calendar(self, config: Dict[str, Any]) -> Optional[CalComCalendar]:
        """Initialize calendar if credentials are available."""
        # Debug logging for calendar configuration
        cal_api_key = config.get('cal_api_key')
        cal_event_type_id = config.get('cal_event_type_id')
        logger.info(f"CALENDAR_DEBUG | cal_api_key present: {bool(cal_api_key)} | cal_event_type_id present: {bool(cal_event_type_id)}")
        logger.info(f"CALENDAR_DEBUG | cal_api_key value: {cal_api_key[:10] if cal_api_key else 'NOT_FOUND'}... | cal_event_type_id value: {cal_event_type_id or 'NOT_FOUND'}")
        logger.info(f"CALENDAR_DEBUG | cal_timezone: {config.get('cal_timezone', 'NOT_FOUND')}")
        
        if config.get("cal_api_key") and config.get("cal_event_type_id"):
            # Validate and convert event_type_id to proper format
            event_type_id = config.get("cal_event_type_id")
            try:
                # Convert to string first, then validate it's a valid number
                if isinstance(event_type_id, str):
                    # Remove any non-numeric characters except for the event type format
                    cleaned_id = event_type_id.strip()
                    # Handle Cal.com event type format like "cal_1759650430507_boxv695kh"
                    if cleaned_id.startswith("cal_"):
                        # Extract the numeric part
                        parts = cleaned_id.split("_")
                        if len(parts) >= 2:
                            numeric_part = parts[1]
                            if numeric_part.isdigit():
                                event_type_id = int(numeric_part)
                            else:
                                logger.error(f"INVALID_EVENT_TYPE_ID | cannot extract number from {cleaned_id}")
                                event_type_id = None
                        else:
                            logger.error(f"INVALID_EVENT_TYPE_ID | malformed cal.com ID {cleaned_id}")
                            event_type_id = None
                    elif cleaned_id.isdigit():
                        event_type_id = int(cleaned_id)
                    else:
                        logger.error(f"INVALID_EVENT_TYPE_ID | not a valid number {cleaned_id}")
                        event_type_id = None
                elif isinstance(event_type_id, (int, float)):
                    event_type_id = int(event_type_id)
                else:
                    logger.error(f"INVALID_EVENT_TYPE_ID | unexpected type {type(event_type_id)}: {event_type_id}")
                    event_type_id = None
            except (ValueError, TypeError) as e:
                logger.error(f"EVENT_TYPE_ID_CONVERSION_ERROR | error={str(e)} | value={event_type_id}")
                event_type_id = None
            
            if event_type_id:
                # Get timezone from config, default to Asia/Karachi for Pakistan
                cal_timezone = config.get("cal_timezone") or "Asia/Karachi"
                logger.info(f"CALENDAR_CONFIG | api_key={'*' * 10} | event_type_id={event_type_id} | timezone={cal_timezone}")
                calendar = CalComCalendar(
                    api_key=config.get("cal_api_key"),
                    event_type_id=event_type_id,
                    timezone=cal_timezone
                )
                # Initialize the calendar
                try:
                    await calendar.initialize()
                    logger.info("CALENDAR_INITIALIZED | calendar setup successful")
                    return calendar
                except Exception as e:
                    logger.error(f"CALENDAR_INIT_FAILED | error={str(e)}")
                    return None
            else:
                logger.error("CALENDAR_CONFIG_FAILED | invalid event_type_id")
                return None
        else:
            return None