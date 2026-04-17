import io
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Iterable, List, Optional
from email.message import EmailMessage

from pydantic import BaseModel

from db.src.connect import AsyncSession


class AbcDBRepository(ABC):
    model: Any

    @abstractmethod
    async def aget(self, id: int, session: AsyncSession) -> Any:
        raise NotImplementedError()

    @abstractmethod
    def get(self, id: int) -> Any:
        raise NotImplementedError()

    @abstractmethod
    async def adelete(self, id: int, session: AsyncSession) -> bool:
        raise NotImplementedError()

    @abstractmethod
    def delete(self, id: int) -> bool:
        raise NotImplementedError()

    @abstractmethod
    async def aupdate(self, obj: BaseModel, session: AsyncSession, consider_all: bool = False) -> Any:
        raise NotImplementedError()

    @abstractmethod
    def update(self, obj: BaseModel, consider_all: bool = False) -> Any:
        raise NotImplementedError()

    @abstractmethod
    async def asave(self, obj: BaseModel, session: AsyncSession) -> Any:
        raise NotImplementedError()

    @abstractmethod
    def save(self, obj: BaseModel) -> Any:
        raise NotImplementedError()

    @abstractmethod
    async def asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[Any]:
        raise NotImplementedError()

    @abstractmethod
    def save_many(self, objs: Iterable[BaseModel]) -> List[Any]:
        raise NotImplementedError()

    async def apost_save(self, obj: BaseModel, db_model: Any) -> Any:
        return db_model

    async def apost_update(self, obj: BaseModel, db_model: Any) -> Any:
        return db_model

    async def apost_delete(self, id: int, db_model: Any) -> bool:
        return db_model is not None

    @abstractmethod
    async def _adelete(self, id: int, session: AsyncSession) -> Any:
        raise NotImplementedError()

    @abstractmethod
    def _delete(self, id: int) -> Any:
        raise NotImplementedError()

    @abstractmethod
    async def _asave(self, obj: BaseModel, session: AsyncSession) -> Any:
        raise NotImplementedError()

    @abstractmethod
    def _save(self, obj: BaseModel) -> Any:
        raise NotImplementedError()

    @abstractmethod
    async def _asave_many(self, objs: Iterable[BaseModel], session: AsyncSession) -> List[Any]:
        raise NotImplementedError()

    @abstractmethod
    def _save_many(self, objs: Iterable[BaseModel]) -> List[Any]:
        raise NotImplementedError()

    @abstractmethod
    async def _aupdate(self, obj: BaseModel, session: AsyncSession, consider_all: bool = False) -> Any:
        raise NotImplementedError()

    @abstractmethod
    def _update(self, obj: BaseModel, consider_all: bool = False) -> Any:
        raise NotImplementedError()


class AbcS3Client(ABC):
    async def aput_object(
        self,
        bucket: Path,
        name: str,
        data: io.BytesIO,
        length: int,
        content_type: str = 'application/octet-stream'
    ) -> None:
        raise NotImplementedError()

    async def aget_object(self, bucket: Path, name: str) -> io.BytesIO:
        raise NotImplementedError()

    async def adelete_object(self, bucket: Path, name: str) -> None:
        raise NotImplementedError()

    async def adelete_bucket(self, bucket: Path) -> None:
        raise NotImplementedError()

    async def abucket_exists(self, bucket: Path) -> bool:
        raise NotImplementedError()

    async def acreate_bucket(self, bucket: Path) -> None:
        raise NotImplementedError()

    async def abuckets(self) -> List[Path]:
        raise NotImplementedError()
    

class AbcPaymentClient(ABC):
    """
    Абстрактный интерфейс для работы с платежными системами.
    Поддерживает создание платежей, рекуррентные платежи, webhook и управление методами оплаты.
    """

    @abstractmethod
    async def __aenter__(self) -> "AbcPaymentClient":
        """Вход в контекстный менеджер."""
        pass

    @abstractmethod
    async def __aexit__(self, exc_type, exc, tb) -> None:
        """Выход из контекстного менеджера с закрытием соединений."""
        pass

    @abstractmethod
    async def setup_webhook(self, webhook_url: str, events: list[str]) -> None:
        """
        Настройка webhook для получения уведомлений о платежах.
        
        Args:
            webhook_url: URL для получения уведомлений
            events: Список событий для отслеживания (например, ["payment.succeeded"])
        """
        pass

    @abstractmethod
    async def create_payment_link(
        self,
        amount: float,
        description: str,
        transaction_id: str,
        email: str,
        return_url: str,
        metadata: Optional[dict] = None,
        save_payment_method: bool = False,
    ) -> str:
        """
        Создание ссылки на оплату.
        
        Args:
            amount: Сумма платежа
            description: Описание платежа
            transaction_id: Уникальный идентификатор транзакции (idempotence key)
            email: Email покупателя
            return_url: URL для возврата после оплаты
            metadata: Дополнительные метаданные
            save_payment_method: Сохранить метод оплаты для рекуррентных платежей
            
        Returns:
            URL для оплаты
        """
        pass

    @abstractmethod
    async def create_recurring_payment(
        self,
        amount: float,
        description: str,
        payment_method_id: str,
        idempotence_key: Optional[str] = None,
        metadata: Optional[dict] = None,
        capture: bool = True,
    ) -> dict:
        """
        Создание рекуррентного платежа.
        
        Args:
            amount: Сумма платежа
            description: Описание платежа
            payment_method_id: ID сохраненного метода оплаты
            idempotence_key: Ключ идемпотентности
            metadata: Дополнительные метаданные
            capture: Автоматическое подтверждение платежа
            
        Returns:
            Информация о платеже
        """
        pass

    @abstractmethod
    async def get_payment_status(self, payment_id: Optional[str] = None) -> dict:
        """
        Получение статуса платежа или списка платежей.
        
        Args:
            payment_id: ID конкретного платежа (если None - вернет список)
            
        Returns:
            Информация о платеже/платежах
        """
        pass

    @abstractmethod
    async def get_balance(self) -> dict:
        """
        Получение баланса и информации об аккаунте.
        
        Returns:
            Информация о балансе
        """
        pass

    @abstractmethod
    async def disable_payment_method(self, payment_method_id: str) -> Optional[dict]:
        """
        Отключение сохраненного метода оплаты.
        
        Args:
            payment_method_id: ID метода оплаты
            
        Returns:
            Результат операции
        """
        pass

    @abstractmethod
    async def aclose(self) -> None:
        """Закрытие всех соединений и освобождение ресурсов."""
        pass


class AbcEmailSenderEngine(ABC):
    @abstractmethod
    def send(self, sender: str, receiver: str, msg: EmailMessage) -> None:
        raise NotImplementedError()

    @abstractmethod
    async def asend(self, sender: str, receiver: str, msg: EmailMessage) -> None:
        raise NotImplementedError()

    @abstractmethod
    def send_many(self, sender: str, receivers: Iterable[str], msg: EmailMessage) -> None:
        raise NotImplementedError()

    @abstractmethod
    async def asend_many(self, sender: str, receivers: Iterable[str], msg: EmailMessage) -> None:
        raise NotImplementedError()

    @abstractmethod
    def close(self) -> None:
        raise NotImplementedError()

    @abstractmethod
    async def aclose(self) -> None:
        raise NotImplementedError()
