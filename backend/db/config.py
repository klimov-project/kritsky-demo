from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict

from config_env import BACKEND_ENV_FILE


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

    model_config = SettingsConfigDict(
        env_file=BACKEND_ENV_FILE,
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
print(
    f"[DB_CONFIG] DB_HOST={SETTINGS.DB_HOST} DB_PORT={SETTINGS.DB_PORT} DB_USER={SETTINGS.DB_USER} DB_NAME={SETTINGS.DB_NAME} DB_PASSWORD={SETTINGS.DB_PASSWORD}"
)
print(
    f"[DB_CONFIG] DB_URL={SETTINGS.DB_URL} ADB_URL={SETTINGS.ADB_URL} TEST={SETTINGS.TEST}"
)
