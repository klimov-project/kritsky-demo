from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict

from config_env import BACKEND_ENV_FILE


class Settings(BaseSettings):
    MINIO_ENDPOINT: str = 'localhost:9000'
    MINIO_ACCESS_KEY: str = 'minioadmin'
    MINIO_SECRET_KEY: str = 'minioadmin'
    MINIO_SECURE: bool = False

    model_config = SettingsConfigDict(
        env_file=BACKEND_ENV_FILE,
        env_file_encoding='utf-8',
        extra='ignore',
    )


SETTINGS = Settings()
