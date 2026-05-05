<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

const auth = useAuth();
const { session } = auth;

// Mock subscription data
const subscription = ref({
  plan: 'free',
  expiresAt: null,
  features: {
    variantsPerDay: 3,
    downloadsPerDay: 0,
    savedVariants: 5,
  },
});

const plans = [
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

const isPro = computed(() => session.value?.user?.isPro || false);
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
          <span v-if="isPro" class="text-4xl">🎖️</span>
          <span v-else class="text-4xl">⭐</span>
        </div>

        <div class="mt-6 grid grid-cols-3 gap-4 text-center">
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-2xl font-bold text-gray-900">
              {{ subscription.features.variantsPerDay }}
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
              {{ subscription.features.savedVariants }}
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

            <NuxtLink
              :to="`/shop/${plan.id}`"
              class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
            >
              Выбрать
            </NuxtLink>
          </div>
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
