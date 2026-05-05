<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

// Mock payment history
const payments = ref([
  {
    id: '1',
    date: '2025-01-15',
    amount: 99,
    plan: 'Месячная подписка',
    status: 'paid',
  },
  {
    id: '2',
    date: '2024-12-15',
    amount: 99,
    plan: 'Месячная подписка',
    status: 'paid',
  },
  {
    id: '3',
    date: '2024-11-15',
    amount: 99,
    plan: 'Месячная подписка',
    status: 'paid',
  },
]);

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'paid':
      return { text: 'Оплачено', class: 'bg-green-100 text-green-700' };
    case 'pending':
      return { text: 'Ожидание', class: 'bg-yellow-100 text-yellow-700' };
    case 'failed':
      return { text: 'Ошибка', class: 'bg-red-100 text-red-700' };
    default:
      return { text: status, class: 'bg-gray-100 text-gray-700' };
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/profile/tariff"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← К тарифу
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">История платежей</h1>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Empty State -->
      <div v-if="payments.length === 0" class="text-center py-20">
        <div class="text-6xl mb-4">💳</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">История пуста</h2>
        <p class="text-gray-600">У вас пока нет оплаченных подписок</p>
      </div>

      <!-- Payments List -->
      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Дата
              </th>
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Тариф
              </th>
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Сумма
              </th>
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Статус
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="payment in payments"
              :key="payment.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ new Date(payment.date).toLocaleDateString('ru-RU') }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ payment.plan }}
              </td>
              <td class="px-6 py-4 text-sm font-medium text-gray-900">
                {{ payment.amount }} ₽
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getStatusLabel(payment.status).class,
                  ]"
                >
                  {{ getStatusLabel(payment.status).text }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
