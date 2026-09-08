from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    APP_NAME: str = "Capacity Connect"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "A Digital Capacity Building and Learning Management Portal for MoES / IMD"
    APP_MODE: str = "central"  # 'central' or 'local'
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres_secure_password@localhost:5432/capacity_connect"
    SQLITE_LOCAL_URL: str = "sqlite+aiosqlite:///./data/capacity_connect_local.db"
    
    # Security & Tokens
    SECRET_KEY: str = "dev_insecure_jwt_secret_key_change_in_production_min_32_bytes_long_12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:80",
        "http://capacityconnect.local"
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    # Storage (Central MinIO / S3)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET_NAME: str = "capacity-connect-media"
    MINIO_SECURE: bool = False

    # Offline / Local Paths
    LOCAL_CONTENT_STORE_PATH: str = "./data/content_store"
    LOCAL_FRONTEND_PATH: str = ""
    STATION_CODE: str = "IMD-HQ-DELHI"
    CENTRAL_SYNC_URL: str = ""
    SYNC_HMAC_SECRET: str = "dev_local_sync_hmac_secret_change_in_production"
    CONTENT_PACK_HMAC_SECRET: str = "dev_content_pack_hmac_secret_change_in_production"

    @property
    def effective_database_url(self) -> str:
        """Returns SQLite URL if running in local offline mode, or PostgreSQL URL for central mode."""
        if self.APP_MODE.lower() == "local":
            return self.SQLITE_LOCAL_URL
        return self.DATABASE_URL


settings = Settings()
