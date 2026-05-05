<script setup lang="ts">
definePageMeta({
  layout: 'admin',
});

// Mock orders data
const orders = ref([
  {
    id: '1',
    user: 'ivan@example.com',
    product: 'Месячная подписка',
    amount: 99,
    status: 'completed',
    createdAt: '2025-01-20',
  },
  {
    id: '2',
    user: 'maria@example.com',
    product: 'Годовая подписка',
    amount: 990,
    status: 'pending',
    createdAt: '2025-01-19',
  },
  {
    id: '3',
    user: 'alex@example.com',
    product: 'Пакет 10 скачиваний',
    amount: 199,
    status: 'completed',
    createdAt: '2025-01-18',
  },
  {
    id: '4',
    user: 'elena@example.com',
    product: 'Месячная подписка',
    amount: 99,
    status: 'failed',
    createdAt: '2025-01-17',
  },
]);

const filterStatus = ref('all');

const filteredOrders = computed(() => {
  if (filterStatus.value === 'all') return orders.value;
  return orders.value.filter((o) => o.status === filterStatus.value);
});

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return { text: 'Завершён', class: 'bg-green-100 text-green-700' };
    case 'pending':
      return { text: 'Ожидание', class: 'bg-yellow-100 text-yellow-700' };
    case 'failed':
      return { text: 'Ошибка', class: 'bg-red-100 text-red-700' };
    default:
      return { text: status, class: 'bg-gray-100 text-gray-700' };
  }
};

const totalRevenue = computed(() => {
  return orders.value
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0);
});
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Заказы</h1>
      <p class="text-gray-600 mt-1">Управление заказами и платежами</p>
    </div>

    <!-- Stats -->
    <div class="grid md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-sm text-gray-500">Всего заказов</p>
        <p class="text-3xl font-bold text-gray-900">{{ orders.length }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-sm text-gray-500">Завершённых</p>
        <p class="text-3xl font-bold text-green-600">
          {{ orders.filter((o) => o.status === 'completed').length }}
        </p>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-sm text-gray-500">Выручка</p>
        <p class="text-3xl font-bold text-blue-600">{{ totalRevenue }} ₽</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <select
        v-model="filterStatus"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">Все заказы</option>
        <option value="completed">Завершённые</option>
        <option value="pending">Ожидающие</option>
        <option value="failed">С ошибками</option>
      </select>
    </div>

    <!-- Orders Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
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
              Продукт
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
          <tr
            v-for="order in filteredOrders"
            :key="order.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 font-mono text-sm text-gray-500">
              #{{ order.id }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">{{ order.user }}</td>
            <td class="px-6 py-4 text-sm text-gray-900">{{ order.product }}</td>
            <td class="px-6 py-4 font-medium text-gray-900">
              {{ order.amount }} ₽
            </td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getStatusLabel(order.status).class,
                ]"
              >
                {{ getStatusLabel(order.status).text }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
              {{ new Date(order.createdAt).toLocaleDateString('ru-RU') }}
            </td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="filteredOrders.length === 0"
        class="text-center py-12 text-gray-500"
      >
        Заказы не найдены
      </div>
    </div>
  </div>
</template>
