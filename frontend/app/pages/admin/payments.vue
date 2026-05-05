<script setup lang="ts">
definePageMeta({
  layout: 'admin',
});

// Mock payments stats
const stats = ref({
  totalRevenue: 25890,
  monthlyRevenue: 8900,
  averageOrder: 156,
  conversionRate: 3.2,
});

// Mock transactions
const transactions = ref([
  {
    id: '1',
    user: 'ivan@example.com',
    amount: 99,
    type: 'subscription',
    status: 'success',
    createdAt: '2025-01-20 14:30',
  },
  {
    id: '2',
    user: 'maria@example.com',
    amount: 990,
    type: 'subscription',
    status: 'success',
    createdAt: '2025-01-19 10:15',
  },
  {
    id: '3',
    user: 'alex@example.com',
    amount: 199,
    type: 'pack',
    status: 'refunded',
    createdAt: '2025-01-18 16:45',
  },
  {
    id: '4',
    user: 'elena@example.com',
    amount: 99,
    type: 'subscription',
    status: 'failed',
    createdAt: '2025-01-17 09:00',
  },
]);

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'success':
      return { text: 'Успешно', class: 'bg-green-100 text-green-700' };
    case 'refunded':
      return { text: 'Возврат', class: 'bg-yellow-100 text-yellow-700' };
    case 'failed':
      return { text: 'Ошибка', class: 'bg-red-100 text-red-700' };
    default:
      return { text: status, class: 'bg-gray-100 text-gray-700' };
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'subscription':
      return 'Подписка';
    case 'pack':
      return 'Пакет';
    case 'book':
      return 'Книга';
    default:
      return type;
  }
};
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Платежи</h1>
      <p class="text-gray-600 mt-1">Статистика и история транзакций</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-sm text-gray-500">Всего выручка</p>
        <p class="text-3xl font-bold text-blue-600">
          {{ stats.totalRevenue.toLocaleString() }} ₽
        </p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-sm text-gray-500">За месяц</p>
        <p class="text-3xl font-bold text-green-600">
          {{ stats.monthlyRevenue.toLocaleString() }} ₽
        </p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-sm text-gray-500">Средний чек</p>
        <p class="text-3xl font-bold text-gray-900">
          {{ stats.averageOrder }} ₽
        </p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-sm text-gray-500">Конверсия</p>
        <p class="text-3xl font-bold text-purple-600">
          {{ stats.conversionRate }}%
        </p>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b">
        <h2 class="text-lg font-bold text-gray-900">Последние транзакции</h2>
      </div>

      <table class="w-full">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th
              class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              ID
            </th>
            <th
              class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Пользователь
            </th>
            <th
              class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Тип
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
            <th
              class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Дата
            </th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 font-mono text-sm text-gray-500">
              #{{ tx.id }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">{{ tx.user }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ getTypeLabel(tx.type) }}
            </td>
            <td class="px-6 py-4 font-medium text-gray-900">
              {{ tx.amount }} ₽
            </td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getStatusLabel(tx.status).class,
                ]"
              >
                {{ getStatusLabel(tx.status).text }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ tx.createdAt }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
