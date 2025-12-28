"""
Database configuration and connection utilities for MongoDB.
"""

import os
import logging
import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    from bson import ObjectId
except ImportError:
    AsyncIOMotorClient = None
    ObjectId = None


@dataclass
class DatabaseConfig:
    """Database configuration settings."""
    url: str
    db_name: str
    enabled: bool = True
    
    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        # Default to a local mongo if not set, or use the node backend's logic if possible
        # We'll assume MONGODB_URI is provided in .env
        url = os.getenv("MONGODB_URI", "")
        if not url:
            # Fallback for dev environment or if env var is different
            url = os.getenv("MONGO_URL", "mongodb://localhost:27017/voice_agent")
            
        db_name = os.getenv("DB_NAME", "test") # Default mongoose db is often 'test' or from URI
        
        # If db_name is in URI, pymongo handles it, but motor's get_default_database() uses it
        return cls(
            url=url,
            db_name=db_name,
            enabled=bool(url)
        )


class DatabaseClient:
    """MongoDB database client wrapper."""
    
    def __init__(self, config: DatabaseConfig = None):
        self.config = config or DatabaseConfig.from_env()
        self._client: Optional[AsyncIOMotorClient] = None
        self._db = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the MongoDB client."""
        if not self.config.enabled:
            logging.warning("Database client disabled - no MongoDB configuration")
            return
        
        if not AsyncIOMotorClient:
            logging.warning("MongoDB client not available - install motor")
            return
        
        try:
            self._client = AsyncIOMotorClient(self.config.url)
            # Use get_default_database() if URI has db, else use config.db_name
            try:
                self._db = self._client.get_default_database()
            except Exception:
                self._db = self._client[self.config.db_name]
                
            logging.info("MongoDB client initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize database client: {e}")
            self._client = None
            self._db = None
    
    @property
    def client(self) -> Optional[AsyncIOMotorClient]:
        """Get the MongoDB client instance."""
        return self._client
    
    @property
    def db(self):
        """Get the database instance."""
        return self._db
    
    def is_available(self) -> bool:
        """Check if database client is available."""
        return self._client is not None and self._db is not None
    
    async def fetch_assistant(self, assistant_id: str) -> Optional[Dict[str, Any]]:
        """Fetch assistant configuration from database."""
        if not self.is_available():
            logging.warning("Database client not available")
            return None
        
        try:
            # Validate ObjectId
            if not ObjectId.is_valid(assistant_id):
                logging.warning(f"Invalid assistant_id format: {assistant_id}")
                return None

            doc = await self._db["assistants"].find_one({"_id": ObjectId(assistant_id)})
            
            if doc:
                logging.info(f"Assistant fetched from database: {assistant_id}")
                return self._flatten_assistant(doc)
            else:
                logging.warning(f"Assistant not found in database: {assistant_id}")
                return None
                
        except Exception as e:
            logging.error(f"Error fetching assistant from database: {e}")
            return None

    async def fetch_assistant_by_phone(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Fetch assistant configuration by phone number."""
        if not self.is_available():
            logging.warning("Database client not available")
            return None
            
        try:
            # Look up phone number to get assistant ID
            # Assuming 'phonenumbers' collection based on mongoose model 'PhoneNumber'
            phone_doc = await self._db["phonenumbers"].find_one({"number": phone_number})
            
            if not phone_doc:
                 # Try 'phone_numbers' just in case
                 phone_doc = await self._db["phone_numbers"].find_one({"number": phone_number})
            
            if not phone_doc:
                logging.warning(f"No assistant found for phone number: {phone_number}")
                return None
                
            assistant_id = phone_doc.get("inboundAssistantId")
            if not assistant_id:
                logging.warning(f"Phone number {phone_number} has no inbound assistant assigned")
                return None
            
            return await self.fetch_assistant(str(assistant_id))
            
        except Exception as e:
            logging.error(f"Error fetching assistant by phone: {e}")
            return None

    def _flatten_assistant(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Map MongoDB schema to flat dictionary expected by LiveKit agent."""
        model_settings = doc.get("modelSettings", {})
        voice_settings = doc.get("voiceSettings", {})
        advanced_settings = doc.get("advancedSettings", {})
        analysis_settings = doc.get("analysisSettings", {})
        n8n_settings = doc.get("n8nSettings", {})
        
        flat = {
            "id": str(doc.get("_id", "")),
            "name": doc.get("name", ""),
            "prompt": model_settings.get("systemPrompt") or doc.get("systemPrompt", ""),
            "first_message": model_settings.get("firstMessage") or doc.get("firstMessage", ""),
            "user_id": str(doc.get("userId", "")),
            
            # Model Settings
            "llm_provider_setting": model_settings.get("provider", "OpenAI"),
            "llm_model_setting": model_settings.get("model", "gpt-4o"),
            "temperature_setting": model_settings.get("temperature", 0.7),
            "max_token_setting": model_settings.get("maxTokens", 250),
            "calendar": model_settings.get("calendar", ""),
            "cal_api_key": model_settings.get("calApiKey", ""),
            "cal_event_type_id": model_settings.get("calEventTypeId", ""),
            "cal_event_type_slug": model_settings.get("calEventTypeSlug", ""),
            "cal_timezone": model_settings.get("calTimezone", ""),
            "idle_messages": model_settings.get("idleMessages", []),
            "max_idle_messages": model_settings.get("idleMessageMaxSpokenCount", 3),

            # Voice Settings
            "voice_provider_setting": voice_settings.get("provider", "OpenAI"),
            "voice_model_setting": voice_settings.get("model", "tts-1"),
            "voice_name_setting": voice_settings.get("voice", "alloy"),
            "silence_timeout": voice_settings.get("silenceTimeout", 3.0),
            "max_call_duration": voice_settings.get("maxDuration", 10),
            "num_words_to_interrupt_assistant": voice_settings.get("numWordsToInterrupt", 2),
            
            # Advanced
            "end_call_message": advanced_settings.get("endCallMessage", ""),
            "transfer_enabled": advanced_settings.get("transferEnabled", False),
            "transfer_phone_number": advanced_settings.get("transferPhoneNumber", ""),
            "transfer_country_code": advanced_settings.get("transferCountryCode", ""),
            "transfer_sentence": advanced_settings.get("transferSentence", ""),
            "transfer_condition": advanced_settings.get("transferCondition", ""),
            
            # Analysis
            "analysisSettings": analysis_settings, # Pass through full settings object
            "structured_data_fields": analysis_settings.get("structuredData", []),
            "analysis_summary_prompt": analysis_settings.get("summaryPrompt", ""),
            "analysis_evaluation_prompt": analysis_settings.get("successEvaluationPrompt", ""),
            "analysis_structured_data_prompt": analysis_settings.get("structuredDataPrompt", ""),
            
            # N8N
            "n8n_webhook_url": n8n_settings.get("webhookUrl", ""),
            
            # Email & Documents
            "email_templates": doc.get("email_templates", {}),
            "assigned_documents": doc.get("assigned_documents", []),
            "dataCollectionSettings": doc.get("dataCollectionSettings", {}),
            "nodes": doc.get("nodes", []),
            "edges": doc.get("edges", [])
        }
        return flat
    
    async def save_call_history(
        self,
        call_id: str,
        assistant_id: str,
        called_did: str,
        call_duration: int,
        call_status: str,
        transcription: list,
        participant_identity: Optional[str] = None,
        recording_sid: Optional[str] = None,
        call_sid: Optional[str] = None,
        user_id: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        call_summary: Optional[str] = None,
        structured_data: Optional[Dict[str, Any]] = None,
        analysis: Optional[Dict[str, Any]] = None,
        client_name: Optional[str] = None,
        client_email: Optional[str] = None
    ) -> bool:
        """Save call history to database."""
        if not self.is_available():
            logging.warning("Database client not available")
            return False
        
        try:
            call_data = {
                "assistant_id": assistant_id,
                "phone_number": called_did,
                "duration": call_duration,
                "status": call_status, # 'completed'
                "transcript": transcription,
                "participant_identity": participant_identity or "",
                "call_sid": call_sid or "",
                "recording_sid": recording_sid or "",
                "call_outcome": call_status, 
                "start_time": start_time or datetime.datetime.now(),
                "end_time": end_time or datetime.datetime.now(),
                "summary": call_summary or "",
                "structured_data": structured_data or {},
                "analysis": analysis or {},
                "client_name": client_name or "",
                "client_email": client_email or "",
                "call_id": call_id,
                "created_at": datetime.datetime.now(),
                "updated_at": datetime.datetime.now()
            }
            
            if user_id and ObjectId.is_valid(user_id):
                call_data["user_id"] = ObjectId(user_id)
            if ObjectId.is_valid(assistant_id):
                 # We could fetch assistant to get user_id, or trust it's not strictly required by Foreign Key constraint in Mongo (it's ref but not enforced like SQL)
                 pass

            # Insert into 'calls' collection
            result = await self._db["calls"].insert_one(call_data)
            
            if result.inserted_id:
                logging.info(f"Call history saved: {call_id} -> {result.inserted_id}")
                return True
            else:
                logging.error(f"Failed to save call history: {call_id}")
                return False
                
        except Exception as e:
            logging.error(f"Error saving call history: {e}")
            return False
    
    async def deduct_minutes(self, user_id: str, minutes: float) -> Dict[str, Any]:
        """
        Deduct minutes from user's account after a call.
        """
        if not self.is_available():
            logging.warning("Database client not available for minutes deduction")
            return {"success": False, "error": "Database not available"}
        
        try:
            if not ObjectId.is_valid(user_id):
                 return {"success": False, "error": "Invalid user_id"}

            minutes_to_deduct = int(minutes) + (1 if minutes % 1 > 0 else 0)
            
            # Find and update in one go (atomic) - but we need to check limit first
            # Or just fetch then update (less atomic but simple)
            
            user = await self._db["users"].find_one({"_id": ObjectId(user_id)})
            if not user:
                 return {"success": False, "error": "User not found"}

            current_limit = user.get("minutes_limit", 0) or 0
            current_used = user.get("minutes_used", 0) or 0
            
            new_used = current_used + minutes_to_deduct
            remaining = max(0, current_limit - new_used)
            
            # Update
            await self._db["users"].update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"minutes_used": new_used}}
            )
            
            exceeded = new_used > current_limit if current_limit > 0 else False
            
            return {
                "success": True,
                "minutes_deducted": minutes_to_deduct,
                "minutes_used": new_used,
                "minutes_limit": current_limit,
                "remaining_minutes": remaining,
                "exceeded_limit": exceeded
            }
                
        except Exception as e:
            logging.error(f"Error deducting minutes: {e}")
            return {"success": False, "error": str(e)}
    
    async def check_minutes_available(self, user_id: str) -> Dict[str, Any]:
        """
        Check if user has minutes available.
        """
        if not self.is_available():
            logging.warning("Database client not available for minutes check")
            return {"available": True, "error": "Database not available - allowing call"}
        
        try:
            if not ObjectId.is_valid(user_id):
                 return {"available": True, "error": "Invalid user_id"}

            user = await self._db["users"].find_one({"_id": ObjectId(user_id)})
            if not user:
                 return {"available": True, "error": "User not found - allowing call"}

            current_limit = user.get("minutes_limit", 0) or 0
            current_used = user.get("minutes_used", 0) or 0
            is_active = user.get("is_active", True)
            
            if current_limit == 0: # Unlimited
                return {"available": True, "unlimited": True}
            
            remaining = max(0, current_limit - current_used)
            available = remaining > 0 and is_active
            
            return {
                "available": available, 
                "remaining_minutes": remaining,
                "is_active": is_active,
                "unlimited": False
            }
            
        except Exception as e:
            logging.error(f"Error checking minutes: {e}")
            return {"available": True, "error": str(e)}


# Global database client instance
_db_client: Optional[DatabaseClient] = None


def get_database_client() -> Optional[DatabaseClient]:
    """Get the global database client instance."""
    global _db_client
    if _db_client is None:
        config = DatabaseConfig.from_env()
        _db_client = DatabaseClient(config)
    return _db_client


def get_database_config() -> DatabaseConfig:
    """Get database configuration."""
    return DatabaseConfig.from_env()
