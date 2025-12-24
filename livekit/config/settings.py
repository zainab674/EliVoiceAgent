"""
Centralized configuration management for the LiveKit voice agent system.
"""

import os
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


@dataclass
class LiveKitConfig:
    """LiveKit server configuration."""
    url: str
    api_key: str
    api_secret: str
    
    @classmethod
    def from_env(cls) -> "LiveKitConfig":
        return cls(
            url=os.getenv("LIVEKIT_URL", ""),
            api_key=os.getenv("LIVEKIT_API_KEY", ""),
            api_secret=os.getenv("LIVEKIT_API_SECRET", "")
        )


@dataclass
class OpenAIConfig:
    """OpenAI API configuration."""
    api_key: str
    llm_model: str = "gpt-4.1-mini"
    stt_model: str = "whisper-1"
    tts_model: str = "tts-1"
    tts_voice: str = "alloy"
    temperature: float = 0.1
    max_tokens: int = 250
    
    @classmethod
    def from_env(cls) -> "OpenAIConfig":
        return cls(
            api_key=os.getenv("OPENAI_API_KEY", ""),
            llm_model=os.getenv("OPENAI_LLM_MODEL", "gpt-4.1-mini"),
            stt_model=os.getenv("OPENAI_STT_MODEL", "whisper-1"),
            tts_model=os.getenv("OPENAI_TTS_MODEL", "tts-1"),
            tts_voice=os.getenv("OPENAI_TTS_VOICE", "alloy"),
            temperature=float(os.getenv("OPENAI_TEMPERATURE", "0.1")),
            max_tokens=int(os.getenv("OPENAI_MAX_TOKENS", "250"))
        )





@dataclass
class SupabaseConfig:
    """Supabase database configuration."""
    url: str
    service_role_key: str
    
    @classmethod
    def from_env(cls) -> "SupabaseConfig":
        return cls(
            url=os.getenv("SUPABASE_URL", ""),
            service_role_key=os.getenv("SUPABASE_SERVICE_ROLE", "") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        )


@dataclass
class CalendarConfig:
    """Calendar integration configuration."""
    api_key: Optional[str] = None
    event_type_id: Optional[str] = None
    timezone: str = "UTC"
    
    @classmethod
    def from_env(cls) -> "CalendarConfig":
        return cls(
            api_key=os.getenv("CAL_API_KEY"),
            event_type_id=os.getenv("CAL_EVENT_TYPE_ID"),
            timezone=os.getenv("CAL_TIMEZONE", "UTC")
        )


@dataclass
class N8NConfig:
    """N8N integration configuration."""
    webhook_url: Optional[str] = None
    auto_create_sheet: bool = False
    drive_folder_id: Optional[str] = None
    spreadsheet_name_template: Optional[str] = None
    sheet_tab_template: Optional[str] = None
    spreadsheet_id: Optional[str] = None
    sheet_tab: Optional[str] = None
    save_name: bool = False
    save_email: bool = False
    save_phone: bool = False
    save_summary: bool = False
    save_sentiment: bool = False
    save_labels: bool = False
    save_recording_url: bool = False
    save_transcript_url: bool = False
    save_duration: bool = False
    save_call_direction: bool = False
    save_from_number: bool = False
    save_to_number: bool = False
    save_cost: bool = False
    custom_fields: list = field(default_factory=list)


@dataclass
class Settings:
    """Main settings container for the LiveKit voice agent system."""
    
    # Core configurations
    livekit: LiveKitConfig
    openai: OpenAIConfig

    supabase: SupabaseConfig
    calendar: CalendarConfig
    
    # Feature flags
    force_first_message: bool = True
    enable_recording: bool = True
    enable_n8n_integration: bool = True
    enable_rag: bool = True
    
    # Logging
    log_level: str = "INFO"
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        self._validate_required_configs()
        self._setup_logging()
    
    def _validate_required_configs(self):
        """Validate that required configurations are present."""
        required_configs = [
            (self.livekit.url, "LIVEKIT_URL"),
            (self.livekit.api_key, "LIVEKIT_API_KEY"),
            (self.livekit.api_secret, "LIVEKIT_API_SECRET"),
            (self.openai.api_key, "OPENAI_API_KEY"),
        ]
        
        missing = []
        for value, name in required_configs:
            if not value:
                missing.append(name)
        
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    def _setup_logging(self):
        """Configure logging based on settings."""
        logging.basicConfig(
            level=getattr(logging, self.log_level.upper()),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    @classmethod
    def from_env(cls) -> "Settings":
        """Create settings from environment variables."""
        return cls(
            livekit=LiveKitConfig.from_env(),
            openai=OpenAIConfig.from_env(),

            supabase=SupabaseConfig.from_env(),
            calendar=CalendarConfig.from_env(),
            force_first_message=os.getenv("FORCE_FIRST_MESSAGE", "true").lower() == "true",
            enable_recording=os.getenv("ENABLE_RECORDING", "true").lower() == "true",
            enable_n8n_integration=os.getenv("ENABLE_N8N_INTEGRATION", "true").lower() == "true",
            enable_rag=os.getenv("ENABLE_RAG", "true").lower() == "true",
            log_level=os.getenv("LOG_LEVEL", "INFO")
        )
    
    def get_n8n_config(self, assistant_data: Dict[str, Any]) -> Optional[N8NConfig]:
        """Extract N8N configuration from assistant data."""
        if not self.enable_n8n_integration or not assistant_data.get("n8n_webhook_url"):
            return None
        
        return N8NConfig(
            webhook_url=assistant_data.get("n8n_webhook_url"),
            auto_create_sheet=assistant_data.get("n8n_auto_create_sheet", False),
            drive_folder_id=assistant_data.get("n8n_drive_folder_id"),
            spreadsheet_name_template=assistant_data.get("n8n_spreadsheet_name_template"),
            sheet_tab_template=assistant_data.get("n8n_sheet_tab_template"),
            spreadsheet_id=assistant_data.get("n8n_spreadsheet_id"),
            sheet_tab=assistant_data.get("n8n_sheet_tab"),
            save_name=assistant_data.get("n8n_save_name", False),
            save_email=assistant_data.get("n8n_save_email", False),
            save_phone=assistant_data.get("n8n_save_phone", False),
            save_summary=assistant_data.get("n8n_save_summary", False),
            save_sentiment=assistant_data.get("n8n_save_sentiment", False),
            save_labels=assistant_data.get("n8n_save_labels", False),
            save_recording_url=assistant_data.get("n8n_save_recording_url", False),
            save_transcript_url=assistant_data.get("n8n_save_transcript_url", False),
            save_duration=assistant_data.get("n8n_save_duration", False),
            save_call_direction=assistant_data.get("n8n_save_call_direction", False),
            save_from_number=assistant_data.get("n8n_save_from_number", False),
            save_to_number=assistant_data.get("n8n_save_to_number", False),
            save_cost=assistant_data.get("n8n_save_cost", False),
            custom_fields=assistant_data.get("n8n_custom_fields", [])
        )


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get the global settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings.from_env()
    return _settings


def reload_settings() -> Settings:
    """Reload settings from environment variables."""
    global _settings
    _settings = Settings.from_env()
    return _settings


def validate_model_names(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and fix model names to prevent API errors."""
    # Valid OpenAI models
    valid_openai_llm_models = {
        "gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo",
        "gpt-4o-2024-08-06", "gpt-4-turbo-2024-04-09", "gpt-3.5-turbo-0125"
    }
    
    valid_openai_tts_models = {
        "tts-1", "tts-1-hd"
    }
    
    valid_openai_stt_models = {
        "whisper-1"
    }
    

    
    # Fix LLM model with comprehensive mapping (like old implementation)
    llm_provider = config.get("llm_provider_setting", "OpenAI")
    llm_model = config.get("llm_model_setting", "gpt-4.1-mini")
    original_model = llm_model
    
    # Map model names to API format based on provider (from old implementation)
    if llm_provider == "OpenAI":
        if llm_model == "GPT-4.1 Mini":
            llm_model = "gpt-4.1-mini"
        elif llm_model == "GPT-4.1":
            llm_model = "gpt-4.1"
        elif llm_model == "GPT-4o Mini":
            llm_model = "gpt-4o-mini"
        elif llm_model == "GPT-4o":
            llm_model = "gpt-4o"
        elif llm_model == "GPT-4 Turbo":
            llm_model = "gpt-4-turbo"
        elif llm_model == "GPT-4":
            llm_model = "gpt-4"
        elif llm_model == "GPT-3.5 Turbo":
            llm_model = "gpt-3.5-turbo"

    elif llm_provider in ["Anthropic", "Google"]:
        # Anthropic and Google providers not implemented, fall back to OpenAI
        logging.warning(f"PROVIDER_NOT_IMPLEMENTED | provider={llm_provider} | falling back to OpenAI")
        config["llm_provider_setting"] = "OpenAI"
        llm_provider = "OpenAI"
        # Map the model to a valid OpenAI model
        if llm_model in ["Claude 3.5 Sonnet", "Claude 3 Opus", "Claude 3 Haiku"]:
            llm_model = "gpt-4o"
        elif llm_model in ["Gemini Pro", "Gemini Pro Vision"]:
            llm_model = "gpt-4o-mini"
        else:
            llm_model = "gpt-4o-mini"
    
    if original_model != llm_model:
        logging.info(f"LLM_MODEL_MAPPED | provider={llm_provider} | original={original_model} | mapped={llm_model}")
        config["llm_model_setting"] = llm_model
    
    # Final validation after mapping
    if llm_provider == "OpenAI" and llm_model not in valid_openai_llm_models:
        logging.warning(f"INVALID_OPENAI_LLM_MODEL | model={llm_model} | using fallback=gpt-4.1-mini")
        config["llm_model_setting"] = "gpt-4.1-mini"

    
    # Fix TTS model with mapping (like old implementation)
    voice_provider = config.get("voice_provider_setting", "OpenAI")
    voice_model = config.get("voice_model_setting", "tts-1")
    original_voice_model = voice_model
    
    # Map TTS model names (from old implementation)
    if voice_provider == "OpenAI":
        if voice_model == "gpt-4o-mini-tts":
            voice_model = "tts-1"

    
    if original_voice_model != voice_model:
        logging.info(f"TTS_MODEL_MAPPED | provider={voice_provider} | original={original_voice_model} | mapped={voice_model}")
        config["voice_model_setting"] = voice_model
    
    # Final validation after mapping
    if voice_provider == "OpenAI" and voice_model not in valid_openai_tts_models:
        logging.warning(f"INVALID_OPENAI_TTS_MODEL | model={voice_model} | using fallback=tts-1")
        config["voice_model_setting"] = "tts-1"

    
    # Fix STT model
    stt_model = config.get("stt_model", "whisper-1")
    if stt_model not in valid_openai_stt_models:
        logging.warning(f"INVALID_STT_MODEL | model={stt_model} | using fallback=whisper-1")
        config["stt_model"] = "whisper-1"
    
    return config