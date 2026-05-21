# Yookassa Payment Integration Guide

## Overview
This guide describes how to use the Yookassa payment integration in the Kritsky API.

## Configuration

Before using payments, add these environment variables to your `.env` file:

```env
YOOKASSA_ACCOUNT_ID=<your_account_id>
YOOKASSA_SECRET_KEY=<your_secret_key>
YOOKASSA_RETURN_URL=http://localhost:3000/checkout/success
```

You can get these credentials from your Yookassa merchant account at https://merchant.yookassa.ru/

## API Endpoints

### 1. Create Payment

**Endpoint:** `POST /api/payments/create`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
    "amount": "1220.00",
    "description": "Заказ №123",
    "order_id": 123,
    "return_url": "http://localhost:3000/checkout/success"
}
```

**Response:**
```json
{
    "payment_id": "27a387af-0014-500d-1db4-0b3f3909d057",
    "confirmation_url": "https://yookassa.ru/...",
    "status": "pending",
    "amount": "1220.00"
}
```

**Usage:**
1. Get the `confirmation_url` from the response
2. Redirect the user to this URL
3. User completes payment on Yookassa
4. Yookassa redirects user back to `return_url`

### 2. Get Payment Status

**Endpoint:** `GET /api/payments/status/{payment_id}`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
    "payment_id": "27a387af-0014-500d-1db4-0b3f3909d057",
    "status": "succeeded",
    "amount": "1220.00",
    "order_id": 123
}
```

### 3. Webhook Handler

**Endpoint:** `POST /api/payments/webhook`

**Authentication:** None (Yookassa will call this endpoint)

This endpoint automatically processes payment status updates from Yookassa:
- Updates payment status in database
- If payment succeeded, marks order as paid
- Processes any side effects (download credits, etc.)

## Frontend Implementation

### Example Flow

```typescript
// 1. Get cart total and create payment
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: cartTotal,
    description: `Заказ №${orderId}`,
    order_id: orderId,
    return_url: window.location.origin + '/checkout/success'
  })
});

const { confirmation_url } = await response.json();

// 2. Redirect to Yookassa
window.location.href = confirmation_url;

// 3. After user returns from Yookassa, check payment status
const statusResponse = await fetch(`/api/payments/status/${paymentId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { status } = await statusResponse.json();

if (status === 'succeeded') {
  // Show success message
  // Redirect to success page
} else if (status === 'pending') {
  // Show pending message
  // Wait for webhook notification
}
```

## Payment Status Flow

```
[User initiates] → [Create Payment] → [Yookassa redirect]
                                              ↓
                                    [User completes payment]
                                              ↓
                                    [Yookassa sends webhook]
                                              ↓
                                    [Payment status updated]
                                              ↓
                                    [Order marked as paid]
```

## Testing with Mock Payments

For development, you can test with Yookassa test credentials:
- Use test account from https://yookassa.ru/developers/payments/payment-process/testing
- Use test card numbers like 4111 1111 1111 1111
- Payment will complete instantly

## Error Handling

Common errors:

- `400 Bad Request`: Invalid amount or missing required fields
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Payment not found in database
- `400 Bad Request`: Yookassa API error (check account credentials)

## Webhook Configuration

In your Yookassa merchant account:
1. Go to Settings → Notifications
2. Add webhook URL: `https://your-domain.com/api/payments/webhook`
3. Subscribe to events: `payment.succeeded`, `payment.canceled`, etc.

## Database Schema

Payments are stored in the `payments` table:
- `id`: Auto-increment ID
- `user_id`: User who made the payment
- `payment_id`: Yookassa payment ID
- `payment_status`: Current status (pending, succeeded, canceled, etc.)
- `amount`: Payment amount in RUB
- `method`: Payment method (yookassa)
- `order_id`: Associated order ID
