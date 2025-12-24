"""
MongoDB client wrapper for database operations.
"""

import logging
from typing import Optional, Dict, Any, List
from config.database import DatabaseClient, get_database_client
from utils.latency_logger import measure_latency_context
try:
    from bson import ObjectId
except ImportError:
    ObjectId = None

class MongoClient:
    """MongoDB client wrapper for LiveKit voice agent."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.db_client = get_database_client()
    
    @property
    def client(self):
        """Get the underlying Motor client."""
        return self.db_client.client if self.db_client else None
        
    @property
    def db(self):
        """Get the underlying Motor database."""
        return self.db_client.db if self.db_client else None
    
    def is_available(self) -> bool:
        """Check if database client is available."""
        return self.db_client is not None and self.db_client.is_available()
    
    async def fetch_assistant(self, assistant_id: str) -> Optional[Dict[str, Any]]:
        """Fetch assistant configuration from database."""
        if not self.is_available():
            self.logger.warning("Database client not available")
            return None
        
        call_id = f"mongo_fetch_{assistant_id}"
        
        async with measure_latency_context("mongo_fetch_assistant", call_id, {
            "assistant_id": assistant_id
        }):
            return await self.db_client.fetch_assistant(assistant_id)
            
    async def fetch_assistant_by_phone(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Fetch assistant configuration by phone number."""
        if not self.is_available():
            self.logger.warning("Database client not available")
            return None
            
        call_id = f"mongo_fetch_phone_{phone_number}"
        async with measure_latency_context("mongo_fetch_assistant_by_phone", call_id, {
            "phone_number": phone_number
        }):
            return await self.db_client.fetch_assistant_by_phone(phone_number)
    
    async def save_call_history(
        self,
        call_id: str,
        assistant_id: str,
        called_did: str,
        call_duration: int,
        call_status: str,
        transcription: List[Dict[str, Any]],
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
            self.logger.warning("Database client not available")
            return False
        
        async with measure_latency_context("mongo_save_call_history", call_id, {
            "assistant_id": assistant_id,
            "call_duration": call_duration,
            "transcription_length": len(transcription),
            "has_recording": bool(recording_sid)
        }):
            return await self.db_client.save_call_history(
                call_id=call_id,
                assistant_id=assistant_id,
                called_did=called_did,
                call_duration=call_duration,
                call_status=call_status,
                transcription=transcription,
                participant_identity=participant_identity,
                recording_sid=recording_sid,
                call_sid=call_sid,
                user_id=user_id,
                start_time=start_time,
                end_time=end_time,
                call_summary=call_summary,
                structured_data=structured_data,
                analysis=analysis,
                client_name=client_name,
                client_email=client_email
            )

    async def save_n8n_spreadsheet_id(self, assistant_id: str, spreadsheet_id: str) -> bool:
        """Save N8N spreadsheet ID for assistant."""
        if not self.is_available():
            self.logger.warning("Database client not available")
            return False
            
        if ObjectId is None or not ObjectId.is_valid(assistant_id):
            return False

        try:
            # We assume n8nSettings exists, if not we create/merge it
            # Using dot notation for update
            result = await self.db["assistants"].update_one(
                {"_id": ObjectId(assistant_id)},
                {"$set": {"n8nSettings.spreadsheetId": spreadsheet_id}}
            )
            
            if result.modified_count > 0:
                self.logger.info(f"N8N_SPREADSHEET_SAVED | assistant_id={assistant_id}")
                return True
            else:
                 # It might be that the value was already the same
                 self.logger.info(f"N8N spreadsheet ID update acknowledged (match found): {assistant_id}")
                 return True 
                 
        except Exception as e:
            self.logger.error(f"Error saving N8N spreadsheet ID: {e}")
            return False
