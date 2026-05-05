<script setup lang="ts">
definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const userId = computed(() => route.params.id);

// Mock user data
const user = ref({
  id: userId.value,
  name: 'Иван Иванов',
  email: 'ivan@example.com',
  phone: '+7 999 123 45 67',
  isPro: true,
  isBlocked: false,
  createdAt: '2024-01-15',
  lastLoginAt: '2025-01-20',
  variantsGenerated: 145,
  variantsDownloaded: 23,
  subscriptionExpiresAt: '2025-02-15',
});

const isSaving = ref(false);

const toggleBlock = async () => {
  isSaving.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    user.value.isBlocked = !user.value.isBlocked;
  } finally {
    isSaving.value = false;
  }
};

const togglePro = async () => {
  isSaving.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    user.value.isPro = !user.value.isPro;
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div>
    <div class="mb-8">
      <NuxtLink
        to="/admin/users"
        class="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
      >
        ← К списку пользователей
      </NuxtLink>
      <h1 class="text-3xl font-bold text-gray-900">{{ user.name }}</h1>
      <p class="text-gray-600 mt-1">{{ user.email }}</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- User Info -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">
            Информация о пользователе
          </h2>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-500 mb-1">Имя</label>
              <p class="font-medium">{{ user.name }}</p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1">Email</label>
              <p class="font-medium">{{ user.email }}</p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1">Телефон</label>
              <p class="font-medium">{{ user.phone || 'Не указан' }}</p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1"
                >Дата регистрации</label
              >
              <p class="font-medium">
                {{ new Date(user.createdAt).toLocaleDateString('ru-RU') }}
              </p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1"
                >Последний вход</label
              >
              <p class="font-medium">
                {{ new Date(user.lastLoginAt).toLocaleDateString('ru-RU') }}
              </p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1"
                >ID пользователя</label
              >
              <p class="font-mono text-sm">{{ user.id }}</p>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Статистика</h2>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-lg p-4 text-center">
              <p class="text-3xl font-bold text-blue-600">
                {{ user.variantsGenerated }}
              </p>
              <p class="text-sm text-gray-500">Вариантов создано</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 text-center">
              <p class="text-3xl font-bold text-green-600">
                {{ user.variantsDownloaded }}
              </p>
              <p class="text-sm text-gray-500">Вариантов скачано</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Статус</h2>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-700">Подписка Pro</span>
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  user.isPro
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700',
                ]"
              >
                {{ user.isPro ? 'Активна' : 'Неактивна' }}
              </span>
            </div>

            <div
              v-if="user.isPro && user.subscriptionExpiresAt"
              class="text-sm text-gray-500"
            >
              Действует до:
              {{
                new Date(user.subscriptionExpiresAt).toLocaleDateString('ru-RU')
              }}
            </div>

            <div class="flex items-center justify-between">
              <span class="text-gray-700">Блокировка</span>
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  user.isBlocked
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700',
                ]"
              >
                {{ user.isBlocked ? 'Заблокирован' : 'Активен' }}
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Действия</h2>

          <div class="space-y-3">
            <button
              @click="togglePro"
              :disabled="isSaving"
              class="w-full py-2 px-4 rounded-lg font-medium transition"
              :class="
                user.isPro
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              "
            >
              {{ user.isPro ? 'Отключить Pro' : 'Включить Pro' }}
            </button>

            <button
              @click="toggleBlock"
              :disabled="isSaving"
              class="w-full py-2 px-4 rounded-lg font-medium transition"
              :class="
                user.isBlocked
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              "
            >
              {{ user.isBlocked ? 'Разблокировать' : 'Заблокировать' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
