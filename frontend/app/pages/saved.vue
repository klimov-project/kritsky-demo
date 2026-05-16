<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

const router = useRouter();

// Mock saved items
const savedItems = ref([
  {
    id: '1',
    type: 'variant',
    title: 'Вариант от 01.01.2025',
    savedAt: '2025-01-02',
    description: 'Полный вариант ЕГЭ',
  },
  {
    id: '2',
    type: 'excerpt',
    title: 'Отрывок из "Евгений Онегин"',
    savedAt: '2025-01-03',
    description: 'Глава первая, строфа I',
  },
  {
    id: '3',
    type: 'poem',
    title: 'Парус (Лермонтов)',
    savedAt: '2025-01-04',
    description: 'Стихотворение для задания 10',
  },
]);

const isLoading = ref(false);

const getItemIcon = (type: string) => {
  switch (type) {
    case 'variant':
      return '📋';
    case 'excerpt':
      return '📖';
    case 'poem':
      return '📜';
    default:
      return '📄';
  }
};

const removeItem = (id: string) => {
  savedItems.value = savedItems.value.filter((item) => item.id !== id);
};

const openItem = (item: any) => {
  if (item.type === 'variant') {
    router.push(`/profile/my-variants/${item.id}`);
  } else {
    // For excerpts and poems, could navigate to a detail page
    console.log('Opening item:', item);
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
            to="/"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← На главную
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">Избранное</h1>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-20">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
        <p class="mt-4 text-gray-600">Загрузка...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="savedItems.length === 0" class="text-center py-20">
        <div class="text-6xl mb-4">⭐</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Избранное пусто</h2>
        <p class="text-gray-600 mb-6">
          Сохраняйте варианты, отрывки и стихотворения для быстрого доступа
        </p>
        <NuxtLink
          to="/create-variant"
          class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Перейти к конструктору
        </NuxtLink>
      </div>

      <!-- Saved Items List -->
      <div v-else class="space-y-4">
        <div
          v-for="item in savedItems"
          :key="item.id"
          class="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-4">
              <span class="text-3xl">{{ getItemIcon(item.type) }}</span>
              <div>
                <h3 class="font-bold text-gray-900">{{ item.title }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ item.description }}</p>
                <p class="text-xs text-gray-400 mt-2">
                  Сохранено:
                  {{ new Date(item.savedAt).toLocaleDateString('ru-RU') }}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                @click="openItem(item)"
                class="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Открыть
              </button>
              <button
                @click="removeItem(item.id)"
                class="text-red-500 hover:text-red-600 text-sm"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
