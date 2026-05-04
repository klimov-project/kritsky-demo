<script setup lang="ts">
const { data: count, refresh, pending } = await useFetch(
  '/api/variants-count',
  {
    server: true,
    lazy: false,
  },
);

const auth = useAuth();
const { session, isAuthenticated, logout } = auth;
const authLoading = computed(() => auth.isLoading);
const showUserMenu = ref(false);

const formattedCount = computed(() => {
  if (count.value === undefined || count.value === null) return '...';
  return formatCompact(Number(count.value));
});

function formatCompact(num: number): string {
  const suffixes = ['', 'тыс', 'млн', 'млрд', 'трлн'];
  let i = 0;
  while (num >= 1000 && i < suffixes.length - 1) {
    num /= 1000;
    i++;
  }
  return num.toFixed(i > 0 ? 1 : 0) + ' ' + suffixes[i];
}

const handleLogout = async () => {
  try {
    await logout();
    showUserMenu.value = false;
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
    <!-- Header/Navigation -->
    <header class="bg-white shadow-sm">
      <div
        class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center"
      >
        <div class="text-2xl font-bold text-blue-600">Критский</div>
        <nav class="flex gap-6 text-sm items-center">
          <NuxtLink to="/" class="text-gray-700 hover:text-blue-600"
            >Главная</NuxtLink
          >
          <NuxtLink to="/admin" class="text-gray-700 hover:text-blue-600"
            >Управление</NuxtLink
          >

          <!-- User Menu -->
          <div class="relative">
            <button
              v-if="isAuthenticated"
              @click="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
            >
              <span class="font-medium">{{
                session?.user?.name || session?.user?.email
              }}</span>
              <span>▼</span>
            </button>
            <NuxtLink
              v-else
              to="/login"
              class="text-gray-700 hover:text-blue-600 font-medium"
            >
              Вход
            </NuxtLink>

            <!-- Dropdown Menu -->
            <div
              v-if="isAuthenticated && showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50"
            >
              <NuxtLink
                to="/profile"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
              >
                👤 Профиль
              </NuxtLink>
              <NuxtLink
                to="/my-variants"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                📚 Мои варианты
              </NuxtLink>
              <NuxtLink
                to="/shop"
                class="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                🎁 Подписка
              </NuxtLink>
              <button
                @click="handleLogout"
                :disabled="authLoading"
                class="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 last:rounded-b-lg disabled:opacity-50"
              >
                🚪 {{ authLoading ? 'Выход...' : 'Выход' }}
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="max-w-6xl mx-auto px-4 py-16 md:py-24">
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Конструктор вариантов ЕГЭ<br />по литературе
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Генерируйте неограниченное количество уникальных вариантов экзамена на
          основе актуальной базы заданий
        </p>
      </div>

      <!-- Main CTA Card -->
      <div class="max-w-2xl mx-auto mb-12">
        <div class="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">
              Доступные варианты
            </h2>
            <p class="text-gray-600">Уникальных комбинаций заданий</p>
          </div>

          <!-- Stats -->
          <div class="text-center mb-8">
            <div v-if="pending" class="text-3xl text-gray-400 animate-pulse">
              Загрузка...
            </div>
            <div
              v-else
              class="text-5xl md:text-6xl font-mono font-bold text-blue-600"
            >
              {{ formattedCount }}
            </div>
          </div>

          <p class="text-gray-600 text-center mb-8">
            Каждый вариант собирается из случайных комбинаций отрывков
            произведений и стихотворений в полном соответствии с форматом ЕГЭ.
          </p>

          <!-- Primary CTA -->
          <div class="space-y-3">
            <NuxtLink
              to="/public-variant"
              class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition text-center text-lg"
            >
              Сгенерировать первый вариант
            </NuxtLink>
            <p class="text-sm text-gray-500 text-center">
              Демонстрационный вариант доступен всем
            </p>
          </div>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="grid md:grid-cols-3 gap-6 mb-12">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="font-bold text-lg mb-2 text-gray-900">📚 Полная база</h3>
          <p class="text-gray-600 text-sm">
            Актуальные отрывки и стихотворения в соответствии с требованиями ЕГЭ
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="font-bold text-lg mb-2 text-gray-900">
            ⚡ Быстрая генерация
          </h3>
          <p class="text-gray-600 text-sm">
            Варианты создаются мгновенно, без ожиданий
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="font-bold text-lg mb-2 text-gray-900">✓ Проверено</h3>
          <p class="text-gray-600 text-sm">
            Каждый вариант проверен на соответствие формату
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-200 py-8 mt-16">
      <div class="max-w-6xl mx-auto px-4">
        <div class="grid md:grid-cols-3 gap-8 mb-6 text-sm">
          <div>
            <h4 class="font-bold mb-3">Информация</h4>
            <div class="space-y-1">
              <NuxtLink to="/about" class="block hover:text-white"
                >О проекте</NuxtLink
              >
              <NuxtLink to="/privacy" class="block hover:text-white"
                >Политика конфиденциальности</NuxtLink
              >
              <NuxtLink to="/terms" class="block hover:text-white"
                >Пользовательское соглашение</NuxtLink
              >
            </div>
          </div>
          <div>
            <h4 class="font-bold mb-3">Работа</h4>
            <div class="space-y-1">
              <NuxtLink to="/admin" class="block hover:text-white"
                >Панель управления</NuxtLink
              >
              <NuxtLink to="/rules" class="block hover:text-white"
                >Правила</NuxtLink
              >
              <a href="#" class="block hover:text-white">Поддержка</a>
            </div>
          </div>
          <div>
            <h4 class="font-bold mb-3">Контакты</h4>
            <p class="text-xs">ИП Крицкий Роман Дмитриевич</p>
            <p class="text-xs">ИНН: 772796119977</p>
            <p class="text-xs">ОГРНИП: 325774600403322</p>
          </div>
        </div>
        <div class="border-t border-gray-700 pt-6 text-center text-xs">
          <p>© Критский, 2026. Все права защищены.</p>
        </div>
      </div>
    </footer>
  </div>
</template>
