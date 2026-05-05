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
  </div>
</template>
