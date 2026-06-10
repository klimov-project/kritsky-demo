<script setup lang="ts">
/**
 * Subscription page with payment plans
 */
definePageMeta({
  layout: 'default',
});

const { isAuthenticated, openLoginModal } = useAuth();
const { plans, isProcessing, purchaseSubscription } = usePayment();

const handlePurchase = (planId: string) => {
  if (!isAuthenticated.value) {
    openLoginModal();
    return;
  }

  purchaseSubscription(planId);
};
</script>

<template>
  <div class="min-h-screen">
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Subscription Plans -->
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Выберите подписку</h2>
      <p class="text-gray-600 mb-8">
        Получите полный доступ ко всем функциям сервиса
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="relative rounded-2xl border-2 p-6 bg-white transition-colors"
          :class="
            plan.recommended
              ? 'border-black shadow-lg'
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

          <div class="mb-6">
            <h3 class="text-xl font-bold text-gray-900">{{ plan.name }}</h3>
            <div class="flex items-baseline gap-1 mt-3">
              <span class="text-4xl font-bold text-gray-900">
                {{ plan.price }} ₽
              </span>
              <span class="text-gray-500">/ {{ plan.period }}</span>
            </div>
            <div v-if="plan.discount" class="flex items-center gap-2 mt-2">
              <span
                class="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded"
              >
                Скидка {{ plan.discount }}
              </span>
            </div>
          </div>

          <ul class="space-y-3 mb-8">
            <li
              v-for="(feature, idx) in plan.features"
              :key="idx"
              class="flex items-start gap-3 text-sm"
            >
              <UIcon
                name="i-lucide-check"
                class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
              />
              <span class="text-gray-700">{{ feature }}</span>
            </li>
          </ul>

          <button
            class="w-full py-3.5 font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
              plan.recommended
                ? 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            "
            :disabled="isProcessing"
            @click="handlePurchase(plan.id)"
          >
            <UIcon
              v-if="isProcessing"
              name="i-lucide-loader-2"
              class="w-4 h-4 animate-spin"
            />
            <UIcon v-else name="i-lucide-credit-card" class="w-4 h-4" />
            <span v-if="!isAuthenticated">Войти и оформить</span>
            <span v-else-if="isProcessing">Обработка...</span>
            <span v-else>Оформить подписку</span>
          </button>
        </div>
      </div>

      <!-- Features Comparison -->
      <div class="bg-white rounded-2xl p-8 mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">
          Что вы получаете
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"
            >
              <UIcon name="i-lucide-infinity" class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 class="font-medium text-gray-900">Безлимитная генерация</h4>
              <p class="text-sm text-gray-600 mt-1">
                Создавайте неограниченное количество вариантов
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"
            >
              <UIcon
                name="i-lucide-download"
                class="w-5 h-5 text-emerald-600"
              />
            </div>
            <div>
              <h4 class="font-medium text-gray-900">3 скачивания в день</h4>
              <p class="text-sm text-gray-600 mt-1">
                Скачивайте до 3 вариантов ежедневно
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0"
            >
              <UIcon name="i-lucide-save" class="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 class="font-medium text-gray-900">Сохранение вариантов</h4>
              <p class="text-sm text-gray-600 mt-1">
                Сохраняйте и возвращайтесь к вариантам позже
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- FAQ / Info -->
      <div class="flex items-start gap-3 p-6 bg-white rounded-2xl">
        <UIcon
          name="i-lucide-shield-check"
          class="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0"
        />
        <div class="text-sm text-gray-600">
          <p class="font-medium text-gray-900 mb-1">Безопасная оплата</p>
          <p>
            Все платежи обрабатываются через защищенное соединение. Подписка
            продлевается автоматически, но вы можете отменить её в любой момент
            в личном кабинете.
          </p>
          <p class="mt-2">
            При возникновении вопросов обращайтесь в поддержку.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
