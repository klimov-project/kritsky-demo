/**
 * Create YooKassa payment for subscription
 *
 * YooKassa API docs: https://yookassa.ru/developers/payment-acceptance/getting-started/quick-start
 */
import { randomUUID } from 'crypto';

interface CreatePaymentBody {
  planId: string;
  amount: number;
  description?: string;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Check auth
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const body = await readBody<CreatePaymentBody>(event);
  const { planId, amount, description } = body;

  if (!planId || !amount) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: planId, amount',
    });
  }

  // YooKassa credentials from env
  const shopId = config.yookassaShopId || process.env.YOOKASSA_SHOP_ID;
  const secretKey = config.yookassaSecretKey || process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    console.error('YooKassa credentials not configured');
    throw createError({
      statusCode: 500,
      statusMessage: 'Payment system not configured',
    });
  }

  // Generate idempotence key for YooKassa
  const idempotenceKey = randomUUID();

  // Build return URL - after payment redirect to activate subscription
  const baseUrl = getRequestURL(event).origin;
  const returnUrl = `${baseUrl}/api/payments/callback?planId=${planId}&userId=${session.user.id}`;

  try {
    // Create payment via YooKassa API
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString(
          'base64',
        )}`,
      },
      body: JSON.stringify({
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB',
        },
        capture: true, // Auto-capture payment
        confirmation: {
          type: 'redirect',
          return_url: returnUrl,
        },
        description: description || `Подписка: ${planId}`,
        metadata: {
          userId: session.user.id,
          planId,
          userEmail: session.user.email,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('YooKassa payment creation error:', error);
      throw createError({
        statusCode: response.status,
        statusMessage: error.description || 'Payment creation failed',
      });
    }

    const payment = await response.json();

    return {
      paymentId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url,
      status: payment.status,
    };
  } catch (error) {
    console.error('Payment creation error:', error);
    if ((error as { statusCode?: number }).statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Payment creation failed',
    });
  }
});
