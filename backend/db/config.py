from __future__ import annotations

import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DB_HOST: str = 'localhost'
    DB_PORT: int = 5432
    DB_USER: str = 'postgres'
    DB_PASSWORD: str = 'postgres'
    DB_NAME: str = 'kritsky'

    TEST: bool = False
    TEST_DB_HOST: str = 'localhost'
    TEST_DB_PORT: int = 5432
    TEST_DB_USER: str = 'postgres'
    TEST_DB_PASSWORD: str = 'postgres'
    TEST_DB_NAME: str = 'kritskytest'

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
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding='utf-8',
        extra='ignore'
    )

    @property
    def ADB_URL(self) -> str:
        return f'postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}'

    @property
    def DB_URL(self) -> str:
        return f'postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}'

    @property
    def TEST_ADB_URL(self) -> str:
        return f'postgresql+asyncpg://{self.TEST_DB_USER}:{self.TEST_DB_PASSWORD}@{self.TEST_DB_HOST}:{self.TEST_DB_PORT}/{self.TEST_DB_NAME}'

    @property
    def TEST_DB_URL(self) -> str:
        return f'postgresql://{self.TEST_DB_USER}:{self.TEST_DB_PASSWORD}@{self.TEST_DB_HOST}:{self.TEST_DB_PORT}/{self.TEST_DB_NAME}'


SETTINGS = Settings()
