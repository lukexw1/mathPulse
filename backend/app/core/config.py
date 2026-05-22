"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App settings from environment / .env file."""

    # Telegram
    bot_token: str = ""
    tma_url: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # Server
    environment: str = "production"
    cors_origins: list[str] = ["https://mathpulse.onrender.com"]

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore extra fields in .env
    )


settings = Settings()
