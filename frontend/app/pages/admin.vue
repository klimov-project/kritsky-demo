<script setup lang="ts">
const { data: kb, pending: kbPending, refresh: refreshKb } = await useFetch(
  '/api/knowledge-base',
);
const {
  data: invalidationData,
  pending: invalidating,
  execute: invalidateCache,
} = await useFetch('/api/invalidate-cache', {
  method: 'POST',
  immediate: false,
  watch: false,
});

const works = computed(() => kb.value?.works || []);
const poets = computed(() => kb.value?.poets || []);

const handleInvalidate = async () => {
  await invalidateCache();
  await refreshKb();
};

const history = computed(() => invalidationData.value?.history || []);
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Управление базой знаний</h1>
      <div class="flex gap-4">
        <NuxtLink
          to="/"
          class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
        >
          На главную
        </NuxtLink>
        <button
          @click="handleInvalidate"
          class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition flex items-center gap-2"
          :disabled="invalidating"
        >
          <span v-if="invalidating" class="animate-spin">↻</span>
          Сбросить кеш
        </button>
      </div>
    </div>

    <!-- Testing Visibility: Cache Invalidation History -->
    <div
      v-if="history.length > 0"
      class="mb-8 bg-blue-50 border border-blue-200 p-4 rounded"
    >
      <h3 class="text-sm font-bold text-blue-800 mb-2 uppercase tracking-wider">
        История инвалидации (Тестирование)
      </h3>
      <ul class="text-xs font-mono space-y-1">
        <li
          v-for="entry in history"
          :key="entry.id"
          class="flex justify-between"
        >
          <span>ID: {{ entry.id }}</span>
          <span>{{ entry.timestamp }}</span>
        </li>
      </ul>
    </div>

    <div v-if="kbPending" class="text-center py-20">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
      ></div>
      <p class="mt-4 text-gray-600">Загрузка базы знаний...</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Works & Excerpts -->
      <section class="bg-white shadow rounded-lg overflow-hidden">
        <div class="bg-gray-800 text-white px-4 py-2 font-bold">
          Произведения и отрывки ({{ works.length }})
        </div>
        <div class="p-4 max-h-[600px] overflow-y-auto">
          <div
            v-for="work in works"
            :key="work.id"
            class="mb-6 border-b pb-4 last:border-0"
          >
            <h3 class="font-bold text-lg">
              {{ work.author }}: {{ work.title }}
            </h3>
            <div class="mt-2 ml-4 space-y-2">
              <div
                v-for="excerpt in work.excerpts"
                :key="excerpt.id"
                class="text-sm bg-gray-50 p-2 rounded"
              >
                <div class="font-mono text-xs text-gray-500 mb-1">
                  ID: {{ excerpt.id }}
                </div>
                <p
                  class="line-clamp-2 text-gray-700 italic"
                  v-html="excerpt.text"
                ></p>
                <div class="mt-1 text-xs text-blue-600">
                  Заданий: {{ excerpt.tasks?.customTask1?.length || 0 }} (свои)
                  + {{ work.commonTasks?.task1?.length || 0 }} (общие)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Poets & Poems -->
      <section class="bg-white shadow rounded-lg overflow-hidden">
        <div class="bg-gray-800 text-white px-4 py-2 font-bold">
          Поэты и стихотворения ({{ poets.length }})
        </div>
        <div class="p-4 max-h-[600px] overflow-y-auto">
          <div
            v-for="poet in poets"
            :key="poet.id"
            class="mb-6 border-b pb-4 last:border-0"
          >
            <h3 class="font-bold text-lg">{{ poet.name }}</h3>
            <div class="mt-2 ml-4 space-y-2">
              <div
                v-for="poem in poet.poems"
                :key="poem.id"
                class="text-sm bg-gray-50 p-2 rounded"
              >
                <div class="font-mono text-xs text-gray-500 mb-1">
                  ID: {{ poem.id }}
                </div>
                <p class="font-bold text-gray-800">{{ poem.title }}</p>
                <p
                  class="line-clamp-2 text-gray-700 italic"
                  v-html="poem.text"
                ></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
