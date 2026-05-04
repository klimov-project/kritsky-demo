<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default',
});

const variants = ref([
  {
    id: 1,
    title: 'Вариант от 01.01.2025',
    date: '01.01.2025',
    views: 5,
    saved: true,
  },
  {
    id: 2,
    title: 'Вариант от 15.12.2024',
    date: '15.12.2024',
    views: 12,
    saved: false,
  },
  {
    id: 3,
    title: 'Вариант от 01.12.2024',
    date: '01.12.2024',
    views: 8,
    saved: true,
  },
]);

const selectedVariantId = ref<number | null>(null);
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
          <h1 class="text-2xl font-bold text-gray-900">Мои варианты</h1>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <div v-if="variants.length === 0" class="text-center py-12">
        <p class="text-gray-600 mb-4">У вас ещё нет сохранённых вариантов</p>
        <NuxtLink
          to="/public-variant"
          class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          Создать новый вариант
        </NuxtLink>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="variant in variants"
          :key="variant.id"
          class="bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer p-6"
          @click="
            selectedVariantId =
              selectedVariantId === variant.id ? null : variant.id
          "
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-lg text-gray-900">
                {{ variant.title }}
              </h3>
              <p class="text-sm text-gray-600 mt-1">
                Дата: {{ variant.date }} • Просмотров: {{ variant.views }}
              </p>
            </div>
            <div class="flex gap-2">
              <span
                v-if="variant.saved"
                class="text-yellow-500 text-lg"
                title="Сохранён"
                >⭐</span
              >
              <span class="text-gray-400">→</span>
            </div>
          </div>

          <div
            v-if="selectedVariantId === variant.id"
            class="mt-4 pt-4 border-t space-y-2"
          >
            <button
              class="block w-full text-left text-blue-600 hover:text-blue-700 font-medium py-1"
            >
              📖 Открыть вариант
            </button>
            <button
              class="block w-full text-left text-blue-600 hover:text-blue-700 font-medium py-1"
            >
              💾 {{ variant.saved ? 'Удалить из сохранённых' : 'Сохранить' }}
            </button>
            <button
              class="block w-full text-left text-blue-600 hover:text-blue-700 font-medium py-1"
            >
              📥 Скачать PDF
            </button>
            <button
              class="block w-full text-left text-red-600 hover:text-red-700 font-medium py-1"
            >
              🗑️ Удалить вариант
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
