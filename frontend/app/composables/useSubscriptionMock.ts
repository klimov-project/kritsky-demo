export const useSubscriptionMock = () => {
  const toast = useToast()
  const userStore = useUserStore()

  const activateSubscription = async () => {
    try {
      const response = await $fetch('/api/subscription/activate-mock', {
        method: 'POST',
      })

      // Update user store with new subscription status
      if (userStore.user) {
        userStore.user.isPro = response.isPro
        userStore.user.subscriptionExpiresAt = response.subscriptionExpiresAt
      }

      toast.add({
        title: 'Успешно',
        description: 'Подписка активирована',
        color: 'green',
        icon: 'i-lucide-check-circle',
      })

      return response
    } catch (error) {
      toast.add({
        title: 'Ошибка',
        description:
          (error as Error).message || 'Не удалось активировать подписку',
        color: 'red',
        icon: 'i-lucide-alert-circle',
      })
      throw error
    }
  }

  const resetSubscription = async () => {
    try {
      const response = await $fetch('/api/subscription/reset-mock', {
        method: 'POST',
      })

      // Update user store with new subscription status
      if (userStore.user) {
        userStore.user.isPro = response.isPro
        userStore.user.subscriptionExpiresAt = response.subscriptionExpiresAt
      }

      toast.add({
        title: 'Успешно',
        description: 'Подписка отключена',
        color: 'green',
        icon: 'i-lucide-check-circle',
      })

      return response
    } catch (error) {
      toast.add({
        title: 'Ошибка',
        description: (error as Error).message || 'Не удалось отключить подписку',
        color: 'red',
        icon: 'i-lucide-alert-circle',
      })
      throw error
    }
  }

  const fetchPaymentHistory = async () => {
    try {
      const response = await $fetch('/api/payments/history')
      return response
    } catch (error) {
      console.error('[v0] Fetch payment history error:', error)
      return {
        items: [
          {
            id: '1',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 99,
            currency: 'RUB',
            description: 'Pro Subscription',
            status: 'completed' as const,
          },
        ],
      }
    }
  }

  return {
    activateSubscription,
    resetSubscription,
    fetchPaymentHistory,
  }
}
