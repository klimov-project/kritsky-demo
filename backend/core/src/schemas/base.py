from typing import Literal
from pydantic import BaseModel, Field


class BaseRes(BaseModel):
    class Msg(BaseModel):
        ru: str
        status: Literal['ok', 'error', 'warning'] = 'ok'
    detail: Msg


class BaseSchema(BaseModel):
    """Абстрактная база для всех схем."""

    class Creation(BaseModel):
        """Базовая модель для create (внутри бекенда)."""
        pass

    class PayloadCreate(BaseModel):
        """Что приходит от фронта при создании."""
        pass

    class Update(BaseModel):
        """Базовая модель для update (внутри бекенда)."""
        id: int = Field(..., description="ID записи")

    class PayloadUpdate(BaseModel):
        """Что приходит от фронта при обновлении."""
        pass
