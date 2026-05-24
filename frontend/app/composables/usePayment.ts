/**
 * Payment composable for YooKassa integration
 * Handles subscription payments with direct payment creation
 */

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  fullPrice: number;
  period: string;
  discount?: string;
  features: string[];
  recommended?: boolean;
}

export interface CreatePaymentRequest {
  amount: number;
  description: string;
  order_id?: number;
  return_url?: string;
}

export interface PaymentResponse {
  paymentId: string;
  confirmation_url: string;
  status: string;
  orderId?: number;
}

export interface PaymentStatusResponse {
  status: 'pending' | 'succeeded' | 'canceled' | 'rejected';
  order_id?: number;
  amount?: number;
  description?: string;
}

export const usePayment = () => {
  const { isAuthenticated, openLoginModal } = useAuth();
  const authApi = useAuthApi();
  const toast = useToast();
  const userStore = useUserStore();
  const router = useRouter();

  const isProcessing = ref(false);
  const isCheckingStatus = ref(false);
  const error = ref<string | null>(null);
  const currentPaymentId = ref<string | null>(null);

  let statusPollInterval: NodeJS.Timeout | null = null;

  // Available subscription plans
  const plans: PaymentPlan[] = [
    {
      id: 'monthly',
      name: 'Месячная подписка',
      price: 890.67,
      fullPrice: 890.67 * 1,
      period: 'месяц',
      features: [
        'Безлимитная генерация',
        '3 скачивания в день',
        'Сохранение вариантов',
      ],
    },
    {
      id: 'yearly',
      name: 'На 6 месяцев подписка',
      price: 690.67,
      fullPrice: 690.67 * 6,
      period: '6 месяцев',
      discount: '21%',
      features: [
        'Безлимитная генерация',
        '3 скачивания в день',
        'Сохранение вариантов',
        'Экономия 21%',
      ],
      recommended: true,
    },
  ];

  /**
   * Create a payment for subscription
   */
  const createPayment = async (
    planId: string,
  ): Promise<PaymentResponse | null> => {
    // Check authentication
    if (!isAuthenticated.value) {
      openLoginModal();
      error.value = 'Для покупки подписки необходимо войти';
      return null;
    }

    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      error.value = 'Тариф не найден';
      return null;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const paymentRequest: CreatePaymentRequest = {
        amount: plan.fullPrice,
        description: `${plan.name} - Критский ЕГЭ`,
        return_url: `${window.location.origin}/profile/subscription/success`,
      };

      const response = await authApi.apiWithAuth<PaymentResponse>(
        '/payments/create',
        {
          method: 'POST',
          body: JSON.stringify(paymentRequest),
        },
      );
      if (!response.confirmation_url) {
        throw new Error('Payment URL not received');
      }

      currentPaymentId.value = response.paymentId;

      toast.add({
        title: 'Платеж создан',
        description: `Переход на страницу оплаты...`,
        color: 'info',
        icon: 'i-lucide-credit-card',
      });

      // Redirect to YooKassa payment page
      window.location.href = response.confirmation_url;

      return response;
    } catch (err) {
      const fetchError = err as {
        data?: { message?: string };
        statusMessage?: string;
        message?: string;
      };
      error.value =
        fetchError?.data?.message ||
        fetchError?.statusMessage ||
        fetchError?.message ||
        'Ошибка создания платежа';
      console.error('[Payment] Create payment error:', err);

      toast.add({
        title: 'Ошибка',
        description: error.value,
        color: 'error',
        icon: 'i-lucide-alert-circle',
      });

      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  const checkPaymentsList = async () => {
    try {
      const response = await authApi.apiWithAuth<PaymentStatusResponse[]>(
        '/shop/payments/history',
        {
          method: 'GET',
        },
      );
      return response;
    } catch (err) {
      const fetchError = err as {
        data?: { message?: string };
        statusMessage?: string;
        message?: string;
      };
      console.error('[Payment] Check payments list error:', fetchError);
      return [];
    }
  };

  /**
   * Check payment status
   */
  const checkPaymentStatus = async (
    paymentId: string,
  ): Promise<PaymentStatusResponse | null> => {
    isCheckingStatus.value = true;
    console.log(`[Payment] Checking status for payment ID: ${paymentId}...`);

    try {
      const response = await authApi.apiWithAuth<PaymentStatusResponse>(
        `/payments/status/${paymentId}`,
        {
          method: 'GET',
        },
      );

      return response;
    } catch (err) {
      const fetchError = err as {
        data?: { message?: string };
        statusMessage?: string;
        message?: string;
      };
      console.error('[Payment] Check status error:', fetchError);
      return null;
    } finally {
      isCheckingStatus.value = false;
    }
  };

  /**
   * Poll payment status until completion
   */
  const pollPaymentStatus = (
    paymentId: string,
    callbacks: {
      onSuccess?: (status: PaymentStatusResponse) => void;
      onFailed?: (status: PaymentStatusResponse) => void;
      onPending?: (status: PaymentStatusResponse) => void;
    },
    intervalMs: number = 3000,
    maxAttempts: number = 60, // 3 minutes max
  ) => {
    let attempts = 0;

    console.log(
      `[Payment] Starting to poll payment status for ID: ${paymentId}...`,
    );

    // Clear any existing interval
    if (statusPollInterval) {
      clearInterval(statusPollInterval);
    }

    const checkStatus = async () => {
      console.log(
        `[Payment] Polling payment status (attempt ${attempts + 1})...`,
      );
      attempts++;
      const status = await checkPaymentStatus(paymentId);

      if (!status) {
        if (attempts >= maxAttempts) {
          stopPolling();
          callbacks.onFailed?.({ status: 'rejected', order_id: undefined });
        }
        return;
      }

      switch (status.status) {
        case 'succeeded':
          stopPolling();
          callbacks.onSuccess?.(status);
          break;
        case 'canceled':
        case 'rejected':
          stopPolling();
          callbacks.onFailed?.(status);
          break;
        case 'pending':
          callbacks.onPending?.(status);
          break;
      }

      if (attempts >= maxAttempts && status.status === 'pending') {
        stopPolling();
        callbacks.onFailed?.({ status: 'rejected', order_id: undefined });
      }
    };

    const stopPolling = () => {
      if (statusPollInterval) {
        clearInterval(statusPollInterval);
        statusPollInterval = null;
      }
    };

    // Start polling
    statusPollInterval = setInterval(checkStatus, intervalMs);
    // Initial check
    checkStatus();

    return stopPolling;
  };

  /**
   * Purchase subscription (full flow: create payment + handle redirect)
   */
  const purchaseSubscription = async (planId: string) => {
    await createPayment(planId);
  };

  /**
   * Activate subscription after successful payment
   */
  const activateSubscription = async () => {
    isProcessing.value = true;
    error.value = null;

    try {
      const response = await authApi.apiWithAuth<{
        isPro: boolean;
        subscriptionExpiresAt: string | null;
      }>('/subscription/activate-mock', { method: 'POST' });

      if (userStore.user) {
        userStore.setUser({
          ...userStore.user,
          isPro: response.isPro,
          subscriptionExpiresAt: response.subscriptionExpiresAt,
        });
      }

      toast.add({
        title: 'Подписка активирована',
        description: 'Теперь у вас есть доступ ко всем функциям',
        color: 'success',
        icon: 'i-lucide-crown',
      });

      return true;
    } catch (err) {
      const fetchError = err as {
        data?: { message?: string };
        statusMessage?: string;
        message?: string;
      };
      error.value =
        fetchError?.data?.message ||
        fetchError?.statusMessage ||
        fetchError?.message ||
        'Ошибка активации подписки';
      console.error('[Payment] Failed to activate subscription:', err);

      toast.add({
        title: 'Ошибка',
        description: error.value,
        color: 'error',
        icon: 'i-lucide-alert-circle',
      });

      return false;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Deactivate subscription (for testing)
   */
  const deactivateSubscription = async () => {
    isProcessing.value = true;
    error.value = null;

    try {
      const response = await authApi.apiWithAuth<{
        isPro: boolean;
        subscriptionExpiresAt: string | null;
      }>('/subscription/reset-mock', { method: 'POST' });

      if (userStore.user) {
        userStore.setUser({
          ...userStore.user,
          isPro: response.isPro,
          subscriptionExpiresAt: response.subscriptionExpiresAt,
        });
      }

      toast.add({
        title: 'Подписка деактивирована',
        description: 'Подписка успешно отменена (тестовый режим)',
        color: 'warning',
        icon: 'i-lucide-alert-triangle',
      });

      return true;
    } catch (err) {
      const fetchError = err as {
        data?: { message?: string };
        statusMessage?: string;
        message?: string;
      };
      error.value =
        fetchError?.data?.message ||
        fetchError?.statusMessage ||
        fetchError?.message ||
        'Ошибка деактивации подписки';
      console.error('[Payment] Failed to deactivate subscription:', err);

      toast.add({
        title: 'Ошибка',
        description: error.value,
        color: 'error',
        icon: 'i-lucide-alert-circle',
      });

      return false;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Get plan by ID
   */
  const getPlan = (planId: string): PaymentPlan | undefined => {
    return plans.find((p) => p.id === planId);
  };

  // Cleanup on unmount
  const cleanup = () => {
    if (statusPollInterval) {
      clearInterval(statusPollInterval);
      statusPollInterval = null;
    }
  };

  return {
    // State
    plans,
    isProcessing: readonly(isProcessing),
    isCheckingStatus: readonly(isCheckingStatus),
    error: readonly(error),
    currentPaymentId: readonly(currentPaymentId),

    // Methods
    createPayment,
    checkPaymentsList,
    checkPaymentStatus,
    pollPaymentStatus,
    purchaseSubscription,
    activateSubscription,
    deactivateSubscription,
    getPlan,
    cleanup,
  };
};
