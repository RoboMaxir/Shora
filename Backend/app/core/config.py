"""
SIMORGH Platform — Core Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql://simorgh:simorgh_pass@localhost:5432/simorgh_db"
    
    # Application
    app_name: str = "SIMORGH Platform"
    environment: str = "development"
    debug: bool = True
    
    # Security
    secret_key: str = "change_this_in_production_min_32_chars"
    
    # LLM Gateway (placeholder)
    llm_provider: str = "openai"
    llm_api_key: Optional[str] = None
    
    # Platform Integration
    use_mock_platform: bool = True
    platform_base_url: Optional[str] = None
    platform_api_key: Optional[str] = None
    
    # Cost Control
    max_tokens_per_run: int = 100000
    max_model_calls_per_run: int = 20
    max_execution_time_seconds: int = 300
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
