
import contextlib
from typing import AsyncGenerator, Generator

from sqlalchemy import text, create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from db.config import SETTINGS
from .base import Base


POOL_SIZE = 10
MAX_OVERFLOW = 20

engine = create_engine(
    SETTINGS.TEST_DB_URL if SETTINGS.TEST else SETTINGS.DB_URL,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
)

aengine = create_async_engine(
    SETTINGS.TEST_ADB_URL if SETTINGS.TEST else SETTINGS.ADB_URL,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
)

AsyncSessionLocal = sessionmaker(
    bind=aengine,
    class_=AsyncSession,
    expire_on_commit=False,
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    expire_on_commit=False,
)


def drop_db():
    Base.metadata.drop_all(engine)


def init_db():
    Base.metadata.create_all(engine)
    _ensure_default_subscription_prices()


def _ensure_default_subscription_prices() -> None:
    """
    Инициализация базовых цен на подписку для различных валют.
    Проверяет наличие цен в БД и добавляет недостающие значения по умолчанию.
    
    Returns:
        None
    """
    from .models import SubscriptionPrice
    from .enums import CurrencyEnum

    default_prices = [
        ("₽", 7400, 2100, CurrencyEnum.RUB),
        ("$", 86, 28, CurrencyEnum.USD),
        ("€", 76, 24, CurrencyEnum.EUR),
        ("BYN", 310, 92, CurrencyEnum.BYN),
        ("₸", 54000, 16000, CurrencyEnum.KZT),
    ]

    with SessionLocal() as session:
        for symbol, old_price, new_price, currency in default_prices:
            existing = session.execute(
                select(SubscriptionPrice).where(SubscriptionPrice.currency == currency)
            ).scalar_one_or_none()
            if existing is not None:
                continue

            session.add(
                SubscriptionPrice(
                    symbol=symbol,
                    oldPrice=old_price,
                    newPrice=new_price,
                    currency=currency,
                )
            )

        session.commit()


@contextlib.asynccontextmanager
async def ainit_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


@contextlib.contextmanager
def init_session() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session


def asession_factory(func):
    async def wrapper(*args, **kwargs):
        if kwargs.get('session') is None:
            async with ainit_session() as session:
                kwargs['session'] = session
                return await func(*args, **kwargs)
        else:
            return await func(*args, **kwargs)
    return wrapper


def session_factory(func):
    def wrapper(*args, **kwargs):
        if kwargs.get('session') is None:
            with init_session() as session:
                kwargs['session'] = session
                return func(*args, **kwargs)
        else:
            return func(*args, **kwargs)
    return wrapper

def ping_connection():
    try:
        with engine.connect() as con:
            con.execute(text('SELECT 1'))
            return True
    except Exception as e:
        return False

async def aping_connection():
    try:
        async with aengine.connect() as con:
            await con.execute(text('SELECT 1'))
            return True
    except Exception as e:
        return False
