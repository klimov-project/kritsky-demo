"""Yookassa Payment Service"""
from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Optional

from yookassa import Configuration, Payment

from api.config import SETTINGS


class YookassaService:
    """Service for handling Yookassa payments"""

    def __init__(self):
        if SETTINGS.YOOKASSA_ACCOUNT_ID and SETTINGS.YOOKASSA_SECRET_KEY:
            Configuration.account_id = SETTINGS.YOOKASSA_ACCOUNT_ID
            Configuration.secret_key = SETTINGS.YOOKASSA_SECRET_KEY

    def create_payment(
        self,
        amount: Decimal,
        description: str,
        order_id: int,
        user_id: int,
        return_url: Optional[str] = None,
    ) -> dict:
        """
        Create a payment in Yookassa
        
        Returns:
            dict with keys:
                - payment_id: str - Yookassa payment ID
                - confirmation_url: str - URL to redirect user to Yookassa
                - status: str - Payment status (pending, succeeded, etc)
        """
        if not SETTINGS.YOOKASSA_ACCOUNT_ID or not SETTINGS.YOOKASSA_SECRET_KEY:
            raise ValueError("Yookassa credentials not configured")

        try:
            payment = Payment.create(
                {
                    "amount": {
                        "value": str(amount),
                        "currency": "RUB"
                    },
                    "confirmation": {
                        "type": "redirect",
                        "return_url": return_url or SETTINGS.YOOKASSA_RETURN_URL
                    },
                    "capture": True,
                    "description": description,
                    "metadata": {
                        "order_id": str(order_id),
                        "user_id": str(user_id)
                    }
                },
                uuid.uuid4()
            )

            return {
                "payment_id": payment.id,
                "confirmation_url": payment.confirmation.confirmation_url,
                "status": payment.status,
                "amount": str(payment.amount.value),
            }
        except Exception as e:
            raise RuntimeError(f"Failed to create Yookassa payment: {str(e)}")

    def get_payment_status(self, payment_id: str) -> dict:
        """Get payment status from Yookassa"""
        if not SETTINGS.YOOKASSA_ACCOUNT_ID or not SETTINGS.YOOKASSA_SECRET_KEY:
            raise ValueError("Yookassa credentials not configured")

        try:
            payment = Payment.find_one(payment_id)
            return {
                "payment_id": payment.id,
                "status": payment.status,
                "amount": str(payment.amount.value),
            }
        except Exception as e:
            raise RuntimeError(f"Failed to get payment status: {str(e)}")


yookassa_service = YookassaService()
