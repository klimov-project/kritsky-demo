from __future__ import annotations

import uuid
from typing import Optional

from aiohttp import ClientSession, BasicAuth
from yookassa import Configuration, Payment, Settings, Webhook
from yookassa.domain.models.currency import Currency
from yookassa.domain.common.confirmation_type import ConfirmationType

from core.src.repos.abc import AbcPaymentClient


class YooKassaClient(AbcPaymentClient):
    """
    Реализация клиента для работы с ЮKassa (YooKassa).
    Поддерживает создание платежей, рекуррентные платежи, webhooks и управление методами оплаты.
    """

    def __init__(
        self,
        shop_id: str,
        api_key: str,
        base_webhook_url: str = "https://kritsky.ru",
        base_return_url: str = "https://kritsky.ru/payment_callback/",
    ):
        """
        Инициализация клиента ЮKassa.
        
        Args:
            shop_id: ID магазина в ЮKassa
            api_key: Секретный ключ API
            base_webhook_url: Базовый URL для webhook (по умолчанию kritsky.ru)
            base_return_url: Базовый URL для возврата после оплаты
        """
        Configuration.configure(shop_id, api_key)
        self.shop_id = shop_id
        self.api_key = api_key
        self.base_webhook_url = base_webhook_url
        self.base_return_url = base_return_url
        self._session: Optional[ClientSession] = None

    async def __aenter__(self) -> "YooKassaClient":
        """Вход в контекстный менеджер с созданием HTTP сессии."""
        self._session = ClientSession()
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        """Выход из контекстного менеджера с закрытием соединений."""
        await self.aclose()

    async def setup_webhook(
        self, 
        webhook_url: Optional[str] = None, 
        events: Optional[list[str]] = None
    ) -> None:
        """
        Настройка webhook для получения уведомлений о платежах.
        
        Args:
            webhook_url: URL для webhook (по умолчанию {base_webhook_url}/payments-check)
            events: Список событий (по умолчанию ["payment.succeeded"])
        """
        if webhook_url is None:
            webhook_url = f"{self.base_webhook_url}/payments-check"
        
        if events is None:
            events = ["payment.succeeded"]

        try:
            existing_webhooks = Webhook.list()
            
            for event in events:
                webhook_exists = any(
                    wh.event == event and wh.url == webhook_url
                    for wh in existing_webhooks.items
                )

                if not webhook_exists:
                    Webhook.add({
                        "event": event,
                        "url": webhook_url
                    })
                    print(f"Webhook добавлен: {event} -> {webhook_url}")
                else:
                    print(f"Webhook уже существует: {event} -> {webhook_url}")
                    
        except Exception as e:
            print(f"Ошибка при настройке webhook: {str(e)}")
            raise

    async def create_payment_link(
        self,
        amount: float,
        description: str,
        transaction_id: str,
        email: str,
        return_url: Optional[str] = None,
        metadata: Optional[dict] = None,
        save_payment_method: bool = False,
    ) -> str:
        """
        Создание ссылки на оплату с автоматической генерацией чека (54-ФЗ).
        
        Args:
            amount: Сумма платежа в рублях
            description: Описание платежа (будет в чеке)
            transaction_id: Уникальный идентификатор транзакции
            email: Email покупателя для отправки чека
            return_url: URL для возврата (по умолчанию {base_return_url}{transaction_id})
            metadata: Дополнительные данные
            save_payment_method: Сохранить карту для рекуррентных платежей
            
        Returns:
            URL для оплаты
        """
        if return_url is None:
            return_url = f"{self.base_return_url}{transaction_id}"

        payment_data = {
            "amount": {
                "value": f"{amount:.2f}",
                "currency": Currency.RUB
            },
            "payment_method_data": {
                "type": "bank_card"
            },
            "confirmation": {
                "type": ConfirmationType.REDIRECT,
                "return_url": return_url
            },
            "description": description,
            "capture": True,
            "receipt": {
                "customer": {
                    "email": email,
                },
                "items": [
                    {
                        "description": description,
                        "quantity": "1.00",
                        "amount": {
                            "value": f"{amount:.2f}",
                            "currency": Currency.RUB
                        },
                        "vat_code": 1,  
                        "payment_mode": "full_payment",
                        "payment_subject": "service"
                    }
                ]
            }
        }

        if metadata:
            payment_data["metadata"] = metadata
            
        if save_payment_method:
            payment_data["save_payment_method"] = True

        payment = Payment.create(payment_data, transaction_id)
        return payment.confirmation.confirmation_url

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
        Создание рекуррентного (автоматического) платежа по сохраненной карте.
        
        Args:
            amount: Сумма платежа в рублях
            description: Описание платежа
            payment_method_id: ID сохраненного метода оплаты
            idempotence_key: Ключ идемпотентности (по умолчанию генерируется UUID)
            metadata: Дополнительные данные
            capture: Автоматическое подтверждение платежа
            
        Returns:
            Объект платежа с информацией о статусе
        """
        payment_data = {
            "amount": {
                "value": f"{amount:.2f}",
                "currency": Currency.RUB
            },
            "payment_method_id": payment_method_id,
            "capture": capture,
            "description": description,
        }

        if metadata:
            payment_data["metadata"] = metadata

        key = idempotence_key or str(uuid.uuid4())
        payment = Payment.create(payment_data, key)
        
        return payment.__dict__ if hasattr(payment, '__dict__') else payment

    async def get_payment_status(self, payment_id: Optional[str] = None) -> dict:
        """
        Получение информации о платеже или списке платежей.
        
        Args:
            payment_id: ID конкретного платежа (если None - вернет список всех)
            
        Returns:
            Информация о платеже или список платежей
        """
        try:
            if payment_id:
                payment = Payment.find_one(payment_id)
                return payment.__dict__ if hasattr(payment, '__dict__') else payment
            else:
                payments = Payment.list()
                return payments.__dict__ if hasattr(payments, '__dict__') else payments
        except Exception as e:
            return {"error": str(e), "payment_id": payment_id}

    async def get_balance(self) -> dict:
        """
        Получение информации об аккаунте магазина (баланс, лимиты и т.д.).
        
        Returns:
            Информация об аккаунте
        """
        try:
            account_info = Settings.get_account_settings()
            return account_info.__dict__ if hasattr(account_info, '__dict__') else {}
        except Exception as e:
            return {"error": str(e)}

    async def disable_payment_method(self, payment_method_id: str) -> Optional[dict]:
        """
        Отключение сохраненного метода оплаты (отвязка карты).
        
        Args:
            payment_method_id: ID метода оплаты для отключения
            
        Returns:
            Результат операции или None
            
        Raises:
            Exception: При ошибке отключения
        """
        if not self._session:
            self._session = ClientSession()

        url = f"https://api.yookassa.ru/v3/payment_methods/{payment_method_id}/disable"
        headers = {
            "Idempotence-Key": str(uuid.uuid4())
        }
        
        auth = BasicAuth(self.shop_id, self.api_key)
        
        try:
            async with self._session.post(
                url, 
                headers=headers, 
                auth=auth,
                timeout=15
            ) as response:
                if response.status not in (200, 202, 204):
                    text = await response.text()
                    raise Exception(
                        f"Ошибка отключения способа оплаты: {response.status} {text}"
                    )
                
                if response.content_length and response.content_length > 0:
                    try:
                        return await response.json()
                    except Exception:
                        return await response.text()
                        
                return None
                
        except Exception as e:
            raise Exception(f"Ошибка при отключении метода оплаты: {str(e)}")

    async def aclose(self) -> None:
        """Закрытие HTTP сессии и освобождение ресурсов."""
        if self._session and not self._session.closed:
            await self._session.close()
            import asyncio
            await asyncio.sleep(0.25)
