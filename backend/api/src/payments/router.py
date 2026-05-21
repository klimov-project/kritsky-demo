"""Payments Router - Yookassa integration"""
from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy import select

from core.src.schemas.core import OrderSchema
from db.src.connect import ainit_session
from db.src.models import Order, OrderItem, Payment, User
from core.src.repos.orders import DbOrdersRepo
from core.src.repos.payments import DbPaymentsRepo
from core.src.repos.users import DbUsersRepo
from core.src.repos.cart import DbCartRepo
from api.src.auth.utils import get_current_user, AuthenticatedUser
from api.src.payments.yookassa_service import yookassa_service
from api.config import SETTINGS

router = APIRouter(prefix="/api/payments", tags=["payments"])


class CreatePaymentRequest(BaseModel):
    amount: Decimal
    description: str
    order_id: Optional[int] = None
    return_url: Optional[str] = None


class CreatePaymentResponse(BaseModel):
    payment_id: str
    confirmation_url: str
    status: str
    amount: str


class PaymentStatusResponse(BaseModel):
    payment_id: str
    status: str
    amount: str
    order_id: Optional[int] = None


@router.post("/create", response_model=CreatePaymentResponse)
async def create_payment(
    payload: CreatePaymentRequest,
    auth: AuthenticatedUser = Depends(get_current_user)
) -> CreatePaymentResponse:
    """Create a payment in Yookassa"""
    try:
        result = yookassa_service.create_payment(
            amount=payload.amount,
            description=payload.description,
            order_id=payload.order_id or 0,
            user_id=auth.user.id,
            return_url=payload.return_url
        )
        
        # Save payment to database with pending status
        async with ainit_session() as session:
            payment = Payment(
                userId=auth.user.id,
                paymentId=result["payment_id"],
                paymentStatus="pending",
                amount=payload.amount,
                method="yookassa",
                order_id=payload.order_id
            )
            DbPaymentsRepo()._save(payment, session)
            await session.commit()
        
        return CreatePaymentResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create payment: {str(e)}"
        )


@router.get("/status/{payment_id}", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_id: str,
    auth: AuthenticatedUser = Depends(get_current_user)
) -> PaymentStatusResponse:
    """Get payment status"""
    try:
        async with ainit_session() as session:
            # Verify payment belongs to user
            result = await session.execute(
                select(Payment).where(
                    (Payment.paymentId == payment_id) & 
                    (Payment.userId == auth.user.id)
                )
            )
            db_payment = result.scalar_one_or_none()
            if not db_payment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Payment not found"
                )
        
        status_info = yookassa_service.get_payment_status(payment_id)
        return PaymentStatusResponse(
            **status_info,
            order_id=db_payment.order_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get payment status: {str(e)}"
        )


@router.post("/webhook")
async def handle_webhook(request: Request):
    """Handle Yookassa webhook notifications"""
    try:
        data = await request.json()
        event_type = data.get("event")
        payment_data = data.get("object", {})
        payment_id = payment_data.get("id")
        payment_status = payment_data.get("status")
        
        if not payment_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No payment ID")
        
        # Update payment status in database
        async with ainit_session() as session:
            # Get payment from DB
            result = await session.execute(
                select(Payment).where(Payment.paymentId == payment_id)
            )
            existing_payment = result.scalar_one_or_none()
            
            if not existing_payment:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
            
            # Update payment status
            payment = Payment(
                id=existing_payment.id,
                userId=existing_payment.userId,
                paymentId=payment_id,
                paymentStatus=payment_status,
                amount=existing_payment.amount,
                method="yookassa",
                order_id=existing_payment.order_id
            )
            
            DbPaymentsRepo()._update(payment, session)
            
            # If payment succeeded, mark order as paid
            if payment_status == "succeeded" and existing_payment.order_id:
                result = await session.execute(
                    select(Order).where(Order.id == existing_payment.order_id)
                )
                order = result.scalar_one_or_none()
                if order:
                    updated_order = Order(
                        id=order.id,
                        user_id=order.user_id,
                        status="Paid",
                        payment_status="Success",
                        payment_method="yookassa",
                        delivery_type=order.delivery_type,
                        delivery_address=order.delivery_address,
                        recipient_name=order.recipient_name,
                        recipient_phone=order.recipient_phone,
                        subtotal_amount=order.subtotal_amount,
                        delivery_amount=order.delivery_amount,
                        total_amount=order.total_amount
                    )
                    DbOrdersRepo()._update(updated_order, session)
            
            await session.commit()
        
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook processing failed: {str(e)}"
        )

