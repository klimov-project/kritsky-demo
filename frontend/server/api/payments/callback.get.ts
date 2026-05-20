/**
 * YooKassa payment callback handler
 *
 * User is redirected here after completing payment on YooKassa
 * We activate the subscription and redirect to success page
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl = `${config.apiBackendBase}/api`;
  const query = getQuery(event);
  const { planId, userId } = query;

  // Check auth
  const session = await getUserSession(event);
  if (!session?.user) {
    // Redirect to login if not authenticated
    return sendRedirect(event, '/login?redirect=/profile/tariff');
  }

  // Verify the user matches
  if (String(session.user.id) !== String(userId)) {
    console.error('User mismatch in payment callback');
    return sendRedirect(event, '/profile/tariff?error=user_mismatch');
  }

  try {
    // Call backend to activate subscription (mock endpoint)
    const response = await fetch(`${backendUrl}/subscription/activate-mock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        userId: session.user.id,
        planId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Subscription activation error:', error);
      return sendRedirect(
        event,
        `/profile/tariff?error=activation_failed&message=${encodeURIComponent(
          error.detail || 'Activation failed',
        )}`,
      );
    }

    const data = await response.json();

    // Update session with new user data if provided
    if (data.user) {
      await setUserSession(event, {
        ...session,
        user: {
          ...session.user,
          isPro: data.user.isPro || true,
        },
      });
    }

    // Redirect to success page
    return sendRedirect(event, '/profile/tariff?success=true');
  } catch (error) {
    console.error('Payment callback error:', error);
    return sendRedirect(event, '/profile/tariff?error=callback_failed');
  }
});
