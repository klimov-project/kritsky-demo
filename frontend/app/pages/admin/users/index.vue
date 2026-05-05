<script setup lang="ts">
definePageMeta({
  layout: 'admin',
});

// Mock users data
const users = ref([
  {
    id: '1',
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    isPro: true,
    isBlocked: false,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Мария Петрова',
    email: 'maria@example.com',
    isPro: false,
    isBlocked: false,
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Алексей Сидоров',
    email: 'alex@example.com',
    isPro: true,
    isBlocked: true,
    createdAt: '2024-03-10',
  },
  {
    id: '4',
    name: 'Елена Козлова',
    email: 'elena@example.com',
    isPro: false,
    isBlocked: false,
    createdAt: '2024-04-05',
  },
]);

const searchQuery = ref('');
const filterStatus = ref('all');

const filteredUsers = computed(() => {
  let result = users.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query),
    );
  }

  if (filterStatus.value === 'pro') {
    result = result.filter((u) => u.isPro);
  } else if (filterStatus.value === 'blocked') {
    result = result.filter((u) => u.isBlocked);
  }

  return result;
});

const toggleBlock = (user: any) => {
  user.isBlocked = !user.isBlocked;
};

const togglePro = (user: any) => {
  user.isPro = !user.isPro;
};
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Пользователи</h1>
        <p class="text-gray-600 mt-1">Управление пользователями платформы</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по имени или email..."
          class="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          v-model="filterStatus"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Все пользователи</option>
          <option value="pro">Только Pro</option>
          <option value="blocked">Заблокированные</option>
        </select>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th
              class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Пользователь
            </th>
            <th
              class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Статус
            </th>
            <th
              class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Дата регистрации
            </th>
            <th
              class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Действия
            </th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4">
              <NuxtLink
                :to="`/admin/users/${user.id}`"
                class="hover:text-blue-600"
              >
                <p class="font-medium text-gray-900">{{ user.name }}</p>
                <p class="text-sm text-gray-500">{{ user.email }}</p>
              </NuxtLink>
            </td>
            <td class="px-6 py-4">
              <div class="flex gap-2">
                <span
                  v-if="user.isPro"
                  class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700"
                >
                  Pro
                </span>
                <span
                  v-if="user.isBlocked"
                  class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700"
                >
                  Заблокирован
                </span>
                <span
                  v-if="!user.isPro && !user.isBlocked"
                  class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                >
                  Free
                </span>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
              {{ new Date(user.createdAt).toLocaleDateString('ru-RU') }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-2">
                <button
                  @click="togglePro(user)"
                  class="text-sm text-blue-600 hover:text-blue-700"
                >
                  {{ user.isPro ? 'Снять Pro' : 'Дать Pro' }}
                </button>
                <button
                  @click="toggleBlock(user)"
                  :class="
                    user.isBlocked
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-red-600 hover:text-red-700'
                  "
                  class="text-sm"
                >
                  {{ user.isBlocked ? 'Разблокировать' : 'Заблокировать' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="filteredUsers.length === 0"
        class="text-center py-12 text-gray-500"
      >
        Пользователи не найдены
      </div>
    </div>
  </div>
</template>
