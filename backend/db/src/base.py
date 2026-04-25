from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, func

Base = declarative_base()


class BaseMixin:
    id: Mapped[int] = mapped_column(primary_key=True)

class CreatedAtMixin:
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )

class UpdatedAtMixin:
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
