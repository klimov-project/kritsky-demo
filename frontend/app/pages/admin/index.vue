<script setup lang="ts">
definePageMeta({
  layout: 'admin',
});

// Mock dashboard data
const stats = ref([
  { label: 'Пользователей', value: 1234, icon: '👥', change: '+12%' },
  { label: 'Вариантов сегодня', value: 567, icon: '📋', change: '+5%' },
  { label: 'Подписчиков', value: 89, icon: '🎖️', change: '+3%' },
  { label: 'Выручка (мес)', value: '8,900 ₽', icon: '💰', change: '+15%' },
]);

const quickLinks = [
  {
    name: 'Управление пользователями',
    href: '/admin/users',
    description: 'Просмотр и редактирование пользователей',
  },
  {
    name: 'База знаний',
    href: '/admin/materials',
    description: 'Управление отрывками и стихотворениями',
  },
  {
    name: 'Заказы',
    href: '/admin/orders',
    description: 'Просмотр и обработка заказов',
  },
  {
    name: 'Платежи',
    href: '/admin/payments',
    description: 'Статистика платежей и транзакции',
  },
];

const recentActivity = ref([
  {
    id: 1,
    action: 'Новый пользователь зарегистрирован',
    user: 'user@example.com',
    time: '5 минут назад',
  },
  {
    id: 2,
    action: 'Оплачена подписка',
    user: 'pro@example.com',
    time: '15 минут назад',
  },
  {
    id: 3,
    action: 'Сгенерирован вариант',
    user: 'student@example.com',
    time: '30 минут назад',
  },
]);
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Дашборд</h1>
      <p class="text-gray-600 mt-1">Сводка по ключевым метрикам платформы</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white rounded-lg shadow p-6"
      >
        <div class="flex items-center justify-between">
          <span class="text-3xl">{{ stat.icon }}</span>
          <span class="text-sm text-green-600 font-medium">{{
            stat.change
          }}</span>
        </div>
        <div class="mt-4">
          <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
          <p class="text-sm text-gray-500">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-8">
      <!-- Quick Links -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Быстрые действия</h2>
        <div class="space-y-3">
          <NuxtLink
            v-for="link in quickLinks"
            :key="link.href"
            :to="link.href"
            class="block p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition"
          >
            <p class="font-medium text-gray-900">{{ link.name }}</p>
            <p class="text-sm text-gray-500">{{ link.description }}</p>
          </NuxtLink>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">
          Последняя активность
        </h2>
        <div class="space-y-4">
          <div
            v-for="activity in recentActivity"
            :key="activity.id"
            class="flex items-start gap-3 pb-4 border-b last:border-0"
          >
            <div class="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            <div>
              <p class="text-sm text-gray-900">{{ activity.action }}</p>
              <p class="text-xs text-gray-500">
                {{ activity.user }} • {{ activity.time }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
