/**
 * Payment composable for YooKassa integration
 *
 * Handles subscription payments with YooKassa
 */

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  discount?: string;
  features: string[];
}

export const usePayment = () => {
  const { isAuthenticated, openLoginModal } = useAuth();

  const isProcessing = ref(false);
  const error = ref<string | null>(null);

  // Available subscription plans
  const plans: PaymentPlan[] = [
    {
      id: 'monthly',
      name: 'Месячная подписка',
      price: 99,
      period: 'месяц',
      features: [
        'Безлимитная генерация',
        '3 скачивания в день',
        'Сохранение вариантов',
      ],
    },
    {
      id: 'yearly',
      name: 'Годовая подписка',
      price: 990,
      period: 'год',
      discount: '16%',
      features: [
        'Безлимитная генерация',
        '5 скачиваний в день',
        'Сохранение вариантов',
      ],
    },
  ];

  /**
   * Initiate payment for a subscription plan
   * Creates YooKassa payment and redirects user to payment page
   */
  const purchaseSubscription = async (planId: string) => {
    // Check authentication
    if (!isAuthenticated.value) {
      openLoginModal();
      error.value = 'Для покупки подписки необходимо войти';
      return;
    }

    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      error.value = 'Тариф не найден';
      return;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      // Create payment via our API
      const response = await $fetch<{
        paymentId: string;
        confirmationUrl: string;
        status: string;
      }>('/api/payments/create', {
        method: 'POST',
        body: {
          planId: plan.id,
          amount: plan.price,
          description: `${plan.name} - Критский ЕГЭ`,
        },
      });

      if (!response.confirmationUrl) {
        throw new Error('Payment URL not received');
      }

      // Redirect to YooKassa payment page
      window.location.href = response.confirmationUrl;
    } catch (err: unknown) {
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
      console.error('Payment error:', err);
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

  return {
    plans,
    isProcessing: readonly(isProcessing),
    error: readonly(error),
    purchaseSubscription,
    getPlan,
  };
};
