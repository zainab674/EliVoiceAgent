"""
Configuration resolver for assistant configurations.
"""

import asyncio
import json
import logging
from typing import Optional, Dict, Any
from livekit.agents import JobContext
from integrations.mongo_client import MongoClient
from utils.data_extractors import extract_did_from_room

logger = logging.getLogger(__name__)


class ConfigResolver:
    """Resolves assistant configurations for different call types."""
    
    def __init__(self, mongo_client: MongoClient):
        self.mongo = mongo_client
    
    async def resolve_assistant_config(self, ctx: JobContext, call_type: str) -> Optional[Dict[str, Any]]:
        """Resolve assistant configuration for the call."""
        try:
            # For web calls, check room metadata first
            if call_type == "web":
                assistant_id = None
                
                # Try to get assistant_id from room metadata
                if ctx.room.metadata:
                    try:
                        room_metadata = json.loads(ctx.room.metadata)
                        assistant_id = room_metadata.get("assistantId") or room_metadata.get("assistant_id")
                        logger.info(f"WEB_ASSISTANT_FROM_ROOM | assistant_id={assistant_id}")
                    except (json.JSONDecodeError, KeyError):
                        pass
                
                # If not found in room metadata, try job metadata
                if not assistant_id and ctx.job.metadata:
                    try:
                        job_metadata = json.loads(ctx.job.metadata)
                        assistant_id = job_metadata.get("assistantId") or job_metadata.get("assistant_id")
                        logger.info(f"WEB_ASSISTANT_FROM_JOB | assistant_id={assistant_id}")
                    except (json.JSONDecodeError, KeyError):
                        pass
                
                if assistant_id:
                    return await self.mongo.fetch_assistant(assistant_id)
                else:
                    logger.error("WEB_NO_ASSISTANT_ID | could not find assistantId in metadata")
                    return None
            
            metadata = ctx.job.metadata
            if not metadata:
                logger.warning("No job metadata available")
                return None
                
            dial_info = json.loads(metadata)
            
            if call_type == "outbound":
                # For outbound calls, get assistant_id from job metadata
                assistant_id = dial_info.get("agentId") or dial_info.get("assistant_id")
                if assistant_id:
                    logger.info(f"OUTBOUND_ASSISTANT | assistant_id={assistant_id}")
                    return await self.mongo.fetch_assistant(assistant_id)
                else:
                    logger.error(f"OUTBOUND_NO_ASSISTANT_ID | metadata={metadata}")
                    return None

            elif call_type == "inbound_with_assistant":
                # For inbound calls with pre-configured assistant, use assistantId from metadata
                assistant_id = dial_info.get("assistantId") or dial_info.get("assistant_id")
                if assistant_id:
                    logger.info(f"INBOUND_WITH_ASSISTANT | assistant_id={assistant_id}")
                    return await self.mongo.fetch_assistant(assistant_id)
                else:
                    logger.error(f"INBOUND_NO_ASSISTANT_ID | metadata={metadata}")
                    return None

            # For regular inbound calls, get the called number (DID) to look up assistant
            called_did = dial_info.get("called_number") or dial_info.get("to_number") or dial_info.get("phoneNumber")
            logger.info(f"INBOUND_METADATA_CHECK | metadata={metadata} | called_did={called_did}")

            # Fallback to room name extraction if not found in metadata
            if not called_did:
                called_did = extract_did_from_room(ctx.room.name)
                logger.info(f"INBOUND_ROOM_NAME_FALLBACK | room={ctx.room.name} | called_did={called_did}")

            if called_did:
                logger.info(f"INBOUND_LOOKUP | looking up assistant for DID={called_did}")
                return await self.mongo.fetch_assistant_by_phone(called_did)

            logger.error("INBOUND_NO_DID | could not determine called number")
            return None

        except Exception as e:
            logger.error(f"ASSISTANT_RESOLUTION_ERROR | error={str(e)}")
            return None
