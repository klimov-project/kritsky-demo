<script setup lang="ts">
definePageMeta({
  layout: false,
});

const router = useRouter();
const { login, isLoading } = useAuth();

const email = ref('');
const password = ref('');
const error = ref('');

const handleSubmit = async (e: Event) => {
  e.preventDefault();
  error.value = '';

  try {
    const result = await login(email.value, password.value);
    if (result?.user?.role === 'admin') {
      router.push('/admin');
    } else {
      error.value = 'Доступ запрещён. Требуются права администратора.';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ошибка входа';
  }
};
</script>

<template>
  <div
    class="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4"
  >
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Критский Admin</h1>
        <p class="text-gray-400">Панель администратора</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Вход в систему</h2>

        <form @submit="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autocomplete="email"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autocomplete="current-password"
            />
          </div>

          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm"
          >
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {{ isLoading ? 'Вход...' : 'Войти' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <NuxtLink to="/" class="text-sm text-blue-600 hover:underline">
            ← Вернуться на сайт
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
