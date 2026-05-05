<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

const subscriptionPlans = ref([
  {
    id: 1,
    name: 'Месячная подписка',
    price: 99,
    currency: '₽',
    period: 'месяц',
    features: [
      'Неограниченная генерация вариантов',
      'До 3 скачиваний в день',
      'Сохранение вариантов',
      'Приоритетная поддержка',
    ],
    popular: true,
  },
  {
    id: 2,
    name: 'Годовая подписка',
    price: 990,
    currency: '₽',
    period: 'год',
    discount: '16%',
    features: [
      'Неограниченная генерация вариантов',
      'До 5 скачиваний в день',
      'Сохранение вариантов',
      'Приоритетная поддержка',
      'Скидка 16% от месячной цены',
    ],
    popular: false,
  },
  {
    id: 3,
    name: 'Пожизненный доступ',
    price: 2999,
    currency: '₽',
    period: 'один раз',
    features: [
      'Вечный доступ к генератору',
      'Неограниченные скачивания',
      'Все текущие и будущие обновления',
      'VIP поддержка',
    ],
    popular: true,
  },
]);

const currentPlan = ref('free');
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-6xl mx-auto px-4 py-4">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← На главную
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">Подписка и тарифы</h1>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-6xl mx-auto px-4 py-12">
      <!-- Current Plan -->
      <div class="mb-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <p class="text-sm text-gray-600">Текущий тариф:</p>
        <p class="text-2xl font-bold text-blue-600">
          {{
            currentPlan === 'free' ? 'Бесплатный доступ' : 'Премиум подписка'
          }}
        </p>
      </div>

      <!-- Plans Grid -->
      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-for="plan in subscriptionPlans"
          :key="plan.id"
          :class="[
            'rounded-lg shadow-lg overflow-hidden transition transform hover:shadow-xl',
            plan.popular ? 'ring-2 ring-blue-600 md:scale-105' : 'bg-white',
          ]"
        >
          <!-- Card Body -->
          <div :class="plan.popular ? 'bg-blue-600 text-white' : 'bg-white'">
            <!-- Header -->
            <div class="p-6">
              <div
                v-if="plan.discount"
                class="mb-2 inline-block bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold"
              >
                Экономия {{ plan.discount }}
              </div>
              <h3 class="text-xl font-bold mb-2">{{ plan.name }}</h3>
              <div class="mb-4">
                <span class="text-4xl font-bold">{{ plan.price }}</span>
                <span class="text-sm opacity-75 ml-1"
                  >{{ plan.currency }}/{{ plan.period }}</span
                >
              </div>
            </div>

            <!-- Features -->
            <div
              :class="plan.popular ? 'bg-blue-700 bg-opacity-50' : 'bg-gray-50'"
            >
              <ul class="p-6 space-y-3">
                <li
                  v-for="(feature, idx) in plan.features"
                  :key="idx"
                  class="flex items-start gap-3"
                >
                  <span class="text-green-500 font-bold mt-1">✓</span>
                  <span class="text-sm">{{ feature }}</span>
                </li>
              </ul>

              <!-- CTA Button -->
              <div class="p-6 pt-0">
                <button
                  :class="[
                    'w-full py-3 px-4 rounded-lg font-bold transition',
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700',
                  ]"
                >
                  Выбрать
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FAQ -->
      <div class="mt-16">
        <h2 class="text-3xl font-bold text-gray-900 mb-8">
          Часто задаваемые вопросы
        </h2>
        <div class="space-y-4">
          <details class="bg-white rounded-lg shadow p-6">
            <summary class="font-bold cursor-pointer"
              >Как отменить подписку?</summary
            >
            <p class="mt-4 text-gray-600">
              Вы можете отменить подписку в любой момент из настроек профиля.
              Средства не возвращаются за оставшийся период.
            </p>
          </details>
          <details class="bg-white rounded-lg shadow p-6">
            <summary class="font-bold cursor-pointer"
              >Какие способы оплаты принимаются?</summary
            >
            <p class="mt-4 text-gray-600">
              Мы принимаем платежи кредитными карточками (Visa, MasterCard) и
              через платёжные системы Яндекс.Касса и PayPal.
            </p>
          </details>
          <details class="bg-white rounded-lg shadow p-6">
            <summary class="font-bold cursor-pointer"
              >Есть ли пробный период?</summary
            >
            <p class="mt-4 text-gray-600">
              На бесплатном плане вы можете генерировать до 3 вариантов. Это
              полнофункциональная демонстрация всех возможностей.
            </p>
          </details>
        </div>
      </div>
    </main>
  </div>
</template>
