from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict

from config_env import BACKEND_ENV_FILE


class Settings(BaseSettings):
    JWT_SECRET: str = 'dev-jwt-secret-change-me'
    JWT_ALGORITHM: str = 'HS256'
    JWT_ACCESS_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_EXPIRE_DAYS: int = 30

    ADMIN_EMAILS: str = 'admin@kritsky.local'
    ADMIN_LOGIN: str = 'admin'
    ADMIN_PASSWORD: str = 'admin'

    REDIS_URL: str = ''
    KB_CACHE_KEY: str = 'knowledge_base:state'
    REDIS_CONNECT_TIMEOUT_SECONDS: float = 1.0
    REDIS_IO_TIMEOUT_SECONDS: float = 1.0
    KB_CACHE_DB_SYNC_INTERVAL_SECONDS: float = 5.0

    model_config = SettingsConfigDict(
        env_file=BACKEND_ENV_FILE,
        env_file_encoding='utf-8',
        extra='ignore',
    )


SETTINGS = Settings()
