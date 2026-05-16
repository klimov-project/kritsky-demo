<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

const route = useRoute();
const auth = useAuth();
const { session, isPro } = auth;
const { plans, purchaseSubscription, isProcessing, error: paymentError } = usePayment();

// Check for success/error from payment callback
const paymentSuccess = computed(() => route.query.success === 'true');
const paymentErrorMessage = computed(() => {
  if (route.query.error === 'user_mismatch') {
    return 'Ошибка: несоответствие пользователя';
  }
  if (route.query.error === 'activation_failed') {
    return route.query.message
      ? decodeURIComponent(route.query.message as string)
      : 'Ошибка активации подписки';
  }
  if (route.query.error === 'callback_failed') {
    return 'Ошибка обработки платежа';
  }
  return null;
});

// Mock subscription data (replace with real data from backend)
const subscription = ref({
  plan: isPro.value ? 'premium' : 'free',
  expiresAt: null as string | null,
  features: {
    variantsPerDay: isPro.value ? -1 : 3, // -1 = unlimited
    downloadsPerDay: isPro.value ? 5 : 0,
    savedVariants: isPro.value ? -1 : 5,
  },
});

// Handle plan purchase
const handlePurchase = async (planId: string) => {
  await purchaseSubscription(planId);
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/profile"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← К профилю
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">Мой тариф</h1>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Success Message -->
      <UAlert
        v-if="paymentSuccess"
        color="success"
        icon="i-lucide-check-circle"
        title="Подписка успешно активирована!"
        description="Теперь вам доступны все премиум функции."
        class="mb-6"
      />

      <!-- Error Message -->
      <UAlert
        v-if="paymentErrorMessage || paymentError"
        color="error"
        icon="i-lucide-alert-circle"
        :title="paymentErrorMessage || paymentError || 'Ошибка'"
        class="mb-6"
      />

      <!-- Current Plan -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Текущий тариф</h2>

        <div class="flex items-center justify-between">
          <div>
            <p
              class="text-2xl font-bold"
              :class="isPro ? 'text-green-600' : 'text-gray-600'"
            >
              {{ isPro ? 'Премиум' : 'Бесплатный' }}
            </p>
            <p v-if="subscription.expiresAt" class="text-sm text-gray-500 mt-1">
              Действует до:
              {{ new Date(subscription.expiresAt).toLocaleDateString('ru-RU') }}
            </p>
          </div>
          <span class="text-4xl">{{ isPro ? '🎖️' : '⭐' }}</span>
        </div>

        <div class="mt-6 grid grid-cols-3 gap-4 text-center">
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-2xl font-bold text-gray-900">
              {{ subscription.features.variantsPerDay === -1 ? '∞' : subscription.features.variantsPerDay }}
            </p>
            <p class="text-xs text-gray-500 mt-1">Генераций в день</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-2xl font-bold text-gray-900">
              {{ subscription.features.downloadsPerDay || '—' }}
            </p>
            <p class="text-xs text-gray-500 mt-1">Скачиваний в день</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-2xl font-bold text-gray-900">
              {{ subscription.features.savedVariants === -1 ? '∞' : subscription.features.savedVariants }}
            </p>
            <p class="text-xs text-gray-500 mt-1">Сохранённых вариантов</p>
          </div>
        </div>
      </div>

      <!-- Available Plans -->
      <div v-if="!isPro">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Доступные тарифы</h2>

        <div class="grid md:grid-cols-2 gap-6">
          <div
            v-for="plan in plans"
            :key="plan.id"
            class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <div v-if="plan.discount" class="mb-2">
              <span
                class="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded"
              >
                Скидка {{ plan.discount }}
              </span>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">
              {{ plan.name }}
            </h3>
            <p class="text-3xl font-bold text-blue-600 mb-4">
              {{ plan.price }} ₽
              <span class="text-sm text-gray-500 font-normal"
                >/{{ plan.period }}</span
              >
            </p>

            <ul class="space-y-2 mb-6">
              <li
                v-for="feature in plan.features"
                :key="feature"
                class="flex items-center gap-2 text-sm"
              >
                <span class="text-green-500">✓</span>
                {{ feature }}
              </li>
            </ul>

            <UButton
              :loading="isProcessing"
              :disabled="isProcessing"
              block
              @click="handlePurchase(plan.id)"
            >
              Оплатить через YooKassa
            </UButton>
          </div>
        </div>

        <!-- Payment info -->
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800">
            <strong>Безопасная оплата:</strong> Платежи обрабатываются через YooKassa (ЮKassa).
            Мы не храним данные ваших карт.
          </p>
        </div>
      </div>

      <!-- Manage Subscription (for Pro users) -->
      <div v-else class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">
          Управление подпиской
        </h2>
        <p class="text-gray-600 mb-4">
          У вас активная премиум подписка. Вы можете управлять ей в настройках.
        </p>
        <div class="flex gap-4">
          <NuxtLink
            to="/profile/tariff-history"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            История платежей →
          </NuxtLink>
          <button class="text-red-600 hover:text-red-700 font-medium">
            Отменить подписку
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
