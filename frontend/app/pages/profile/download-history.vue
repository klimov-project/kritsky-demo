<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

// Mock download history
const downloads = ref([
  {
    id: '1',
    date: '2025-01-20',
    variantTitle: 'Вариант 1 от 20.01.2025',
    format: 'PDF',
  },
  {
    id: '2',
    date: '2025-01-19',
    variantTitle: 'Вариант 2 от 19.01.2025',
    format: 'PDF',
  },
  {
    id: '3',
    date: '2025-01-18',
    variantTitle: 'Вариант 3 от 18.01.2025',
    format: 'PDF',
  },
]);

const downloadAgain = (download: any) => {
  console.log('Re-downloading:', download);
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/profile"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← К профилю
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">История скачиваний</h1>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Empty State -->
      <div v-if="downloads.length === 0" class="text-center py-20">
        <div class="text-6xl mb-4">📥</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Скачиваний нет</h2>
        <p class="text-gray-600 mb-6">Вы ещё не скачивали варианты</p>
        <NuxtLink
          to="/create-variant"
          class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Создать вариант
        </NuxtLink>
      </div>

      <!-- Downloads List -->
      <div v-else class="space-y-4">
        <div
          v-for="download in downloads"
          :key="download.id"
          class="bg-white rounded-lg shadow p-6"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-gray-900">
                {{ download.variantTitle }}
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                {{ new Date(download.date).toLocaleDateString('ru-RU') }} •
                {{ download.format }}
              </p>
            </div>
            <button
              @click="downloadAgain(download)"
              class="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Скачать снова
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
