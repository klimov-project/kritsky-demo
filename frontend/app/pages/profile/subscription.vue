<script setup lang="ts">
/**
 * Subscription management page with mock activate/deactivate
 */
definePageMeta({
  middleware: 'auth',
});

const toast = useToast()

const userStore = useUserStore()
const { user, subscriptionExpiryFormatted, hasActiveSubscription } =
  storeToRefs(userStore)

const isActivating = ref(false)
const isDeactivating = ref(false)

// Fetch user data on mount
onMounted(async () => {
  await userStore.fetchUser()
})

/**
 * Activate mock subscription
 * POST /api/subscription/activate-mock
 */
const activateSubscription = async () => {
  isActivating.value = true
  try {
    const response = await $fetch('/api/subscription/activate-mock', {
      method: 'POST',
    })

    // Update user store with new subscription status
    if (userStore.user) {
      userStore.setUser({
        ...userStore.user,
        isPro: response.isPro,
        subscriptionExpiresAt: response.subscriptionExpiresAt,
      })
    }

    toast.add({
      title: 'Подписка активирована',
      description: 'Теперь у вас есть доступ ко всем функциям',
      color: 'success',
      icon: 'i-lucide-crown',
    })
  } catch (error) {
    console.error('[v0] Failed to activate subscription:', error)
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось активировать подписку',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isActivating.value = false
  }
}

/**
 * Reset mock subscription (deactivate)
 * POST /api/subscription/reset-mock
 */
const deactivateSubscription = async () => {
  isDeactivating.value = true
  try {
    await $fetch('/api/subscription/reset-mock', {
      method: 'POST',
    })

    // Update user store with reset subscription status
    if (userStore.user) {
      userStore.setUser({
        ...userStore.user,
        isPro: false,
        subscriptionExpiresAt: null,
      })
    }

    toast.add({
      title: 'Подписка деактивирована',
      description: 'Подписка успешно отменена (тестовый режим)',
      color: 'warning',
      icon: 'i-lucide-alert-triangle',
    })
  } catch (error) {
    console.error('[v0] Failed to deactivate subscription:', error)
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось деактивировать подписку',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  } finally {
    isDeactivating.value = false
  }
}

// Subscription plans
const plans = [
  {
    id: 'monthly',
    name: 'Месячная',
    price: 299,
    period: 'месяц',
    features: [
      'Безлимитная генерация вариантов',
      '3 скачивания в день',
      'Сохранение вариантов в профиль',
      'Печать вариантов',
    ],
  },
  {
    id: 'yearly',
    name: 'Годовая',
    price: 2990,
    period: 'год',
    discount: '17%',
    features: [
      'Все функции месячной подписки',
      'Экономия 17%',
      'Приоритетная поддержка',
      'Ранний доступ к новым функциям',
    ],
    recommended: true,
  },
];
</script>

<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Main Card -->
      <div class="bg-white rounded-3xl p-6 md:p-10 shadow-sm">
        <div class="flex flex-col lg:flex-row gap-10">
          <!-- Sidebar -->
          <ProfileSidebar active-item="subscription" />

          <!-- Main Content -->
          <main class="flex-1">
            <!-- Header -->
            <div class="border-b border-gray-200 mb-8 pb-4">
              <h1 class="text-2xl font-bold">Подписка</h1>
              <p class="text-gray-500 mt-1">
                Управление вашей подпиской на сервис
              </p>
            </div>

            <!-- Current Status -->
            <div
              class="rounded-2xl p-6 mb-8"
              :class="hasActiveSubscription ? 'bg-emerald-50' : 'bg-gray-50'"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start gap-4">
                  <div
                    class="w-14 h-14 rounded-full flex items-center justify-center"
                    :class="
                      hasActiveSubscription ? 'bg-emerald-100' : 'bg-gray-200'
                    "
                  >
                    <UIcon
                      :name="
                        hasActiveSubscription
                          ? 'i-lucide-crown'
                          : 'i-lucide-lock'
                      "
                      class="w-7 h-7"
                      :class="
                        hasActiveSubscription
                          ? 'text-emerald-600'
                          : 'text-gray-500'
                      "
                    />
                  </div>
                  <div>
                    <h2 class="text-xl font-bold">
                      {{
                        hasActiveSubscription
                          ? 'Подписка активна'
                          : 'Нет активной подписки'
                      }}
                    </h2>
                    <p
                      v-if="hasActiveSubscription"
                      class="text-gray-600 mt-1"
                    >
                      Действует до {{ subscriptionExpiryFormatted }}
                    </p>
                    <p v-else class="text-gray-600 mt-1">
                      Оформите подписку для полного доступа
                    </p>
                  </div>
                </div>
                <span
                  class="px-3 py-1.5 text-sm font-medium rounded-full"
                  :class="
                    hasActiveSubscription
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-200 text-gray-600'
                  "
                >
                  {{ hasActiveSubscription ? 'Pro' : 'Free' }}
                </span>
              </div>
            </div>

            <!-- Mock Actions (for testing) -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
              <div class="flex items-start gap-3 mb-4">
                <UIcon
                  name="i-lucide-test-tube"
                  class="w-5 h-5 text-yellow-600 mt-0.5"
                />
                <div>
                  <h3 class="font-semibold text-yellow-800">
                    Тестовый режим
                  </h3>
                  <p class="text-sm text-yellow-700 mt-1">
                    Используйте эти кнопки для тестирования функционала подписки
                  </p>
                </div>
              </div>
              <div class="flex flex-wrap gap-3">
                <button
                  class="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  :disabled="isActivating || hasActiveSubscription"
                  @click="activateSubscription"
                >
                  <UIcon
                    v-if="isActivating"
                    name="i-lucide-loader-2"
                    class="w-4 h-4 animate-spin"
                  />
                  <UIcon v-else name="i-lucide-zap" class="w-4 h-4" />
                  Активировать подписку
                </button>
                <button
                  class="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  :disabled="isDeactivating || !hasActiveSubscription"
                  @click="deactivateSubscription"
                >
                  <UIcon
                    v-if="isDeactivating"
                    name="i-lucide-loader-2"
                    class="w-4 h-4 animate-spin"
                  />
                  <UIcon v-else name="i-lucide-x" class="w-4 h-4" />
                  Деактивировать (тест)
                </button>
              </div>
            </div>

            <!-- Subscription Plans -->
            <h2 class="text-lg font-semibold mb-6">Тарифные планы</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div
                v-for="plan in plans"
                :key="plan.id"
                class="relative rounded-2xl border-2 p-6 transition-colors"
                :class="
                  plan.recommended
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                "
              >
                <!-- Recommended Badge -->
                <span
                  v-if="plan.recommended"
                  class="absolute -top-3 left-6 px-3 py-1 bg-black text-white text-xs font-medium rounded-full"
                >
                  Рекомендуем
                </span>

                <div class="mb-4">
                  <h3 class="text-xl font-bold">{{ plan.name }}</h3>
                  <div class="flex items-baseline gap-1 mt-2">
                    <span class="text-3xl font-bold">{{ plan.price }} ₽</span>
                    <span class="text-gray-500">/ {{ plan.period }}</span>
                  </div>
                  <span
                    v-if="plan.discount"
                    class="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded"
                  >
                    Скидка {{ plan.discount }}
                  </span>
                </div>

                <ul class="space-y-3 mb-6">
                  <li
                    v-for="(feature, idx) in plan.features"
                    :key="idx"
                    class="flex items-start gap-2 text-sm"
                  >
                    <UIcon
                      name="i-lucide-check"
                      class="w-5 h-5 text-emerald-500 flex-shrink-0"
                    />
                    <span>{{ feature }}</span>
                  </li>
                </ul>

                <button
                  class="w-full py-3 font-medium rounded-lg transition-colors"
                  :class="
                    plan.recommended
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  "
                >
                  Выбрать план
                </button>
              </div>
            </div>

            <!-- Info -->
            <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <UIcon
                name="i-lucide-info"
                class="w-5 h-5 text-gray-500 mt-0.5"
              />
              <div class="text-sm text-gray-600">
                <p>
                  Подписка продлевается автоматически. Вы можете отменить
                  автопродление в любой момент.
                </p>
                <p class="mt-1">
                  При возникновении вопросов обращайтесь в поддержку.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>
