/**
 * YooKassa webhook handler
 *
 * Receives payment status updates from YooKassa
 * Processes successful payments and updates subscriptions
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl = `${config.apiBackendBase}/api`;

  try {
    const body = await readBody(event);

    // Validate webhook structure
    if (!body.event || !body.object) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid webhook payload',
      });
    }

    const { event: eventType, object: payment } = body;

    console.log(`YooKassa webhook received: ${eventType}`, {
      paymentId: payment.id,
      status: payment.status,
    });

    // Handle successful payment
    if (eventType === 'payment.succeeded' && payment.status === 'succeeded') {
      const metadata = payment.metadata || {};
      const { userId, planId } = metadata;

      if (!userId || !planId) {
        console.warn('Missing metadata in payment:', payment.id);
        return { received: true };
      }

      // Activate subscription via backend
      const response = await fetch(`${backendUrl}/subscription/activate-mock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planId,
          paymentId: payment.id,
          amount: payment.amount?.value,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Subscription activation via webhook failed:', error);
        // Still return 200 to YooKassa to prevent retries
        // We should handle this with alerting in production
      } else {
        console.log(
          `Subscription activated for user ${userId}, plan ${planId}`,
        );
      }
    }

    // Handle cancelled payment
    if (eventType === 'payment.canceled') {
      console.log('Payment cancelled:', payment.id);
      // Could notify user or clean up pending state
    }

    // Handle refund
    if (eventType === 'refund.succeeded') {
      const metadata = payment.metadata || {};
      console.log('Refund processed:', payment.id, metadata);
      // Could deactivate subscription
    }

    return { received: true };
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent YooKassa from retrying
    // In production, you'd want alerting for failed webhooks
    return { received: true, error: 'Processing failed' };
  }
});
