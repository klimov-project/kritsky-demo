<script setup lang="ts">
import { useKnowledgeBase } from '~/composables/useKnowledgeBase';

definePageMeta({
  layout: 'admin',
});

const { kbStore, loadKnowledgeBase } = useKnowledgeBase();
await loadKnowledgeBase();

const activeTab = ref<'works' | 'poets'>('works');
const searchQuery = ref('');

const works = computed(() => kbStore.works ?? [])
const poets = computed(() => kbStore.poets ?? [])

const filteredWorks = computed(() => {
  if (!searchQuery.value) return kbStore.works;
  const query = searchQuery.value.toLowerCase();
  return kbStore.works.filter(
    (w: any) =>
      w.title?.toLowerCase().includes(query) ||
      w.author?.toLowerCase().includes(query),
  );
});

const filteredPoets = computed(() => {
  if (!searchQuery.value) return kbStore.poets;
  const query = searchQuery.value.toLowerCase();
  return kbStore.poets.filter((p: any) => p.name?.toLowerCase().includes(query));
});

const { execute: invalidateCache, pending: invalidating } = await useFetch<any>(
  '/api/invalidate-cache',
  {
    method: 'POST',
    immediate: false,
    watch: false,
  },
);

const handleInvalidate = async () => {
  await invalidateCache();
  await loadKnowledgeBase(true);
};
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Материалы</h1>
        <p class="text-gray-600 mt-1">
          База знаний: произведения, отрывки, стихотворения
        </p>
      </div>
      <button
        @click="handleInvalidate"
        :disabled="invalidating"
        class="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
      >
        <span v-if="invalidating" class="animate-spin">↻</span>
        Сбросить кеш
      </button>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-lg shadow mb-6">
      <div class="flex border-b">
        <button
          @click="activeTab = 'works'"
          :class="[
            'px-6 py-3 font-medium transition',
            activeTab === 'works'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          Произведения ({{ works.length }})
        </button>
        <button
          @click="activeTab = 'poets'"
          :class="[
            'px-6 py-3 font-medium transition',
            activeTab === 'poets'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          Поэты ({{ poets.length }})
        </button>
      </div>

      <!-- Search -->
      <div class="p-4 border-b">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Loading -->
      <div v-if="pending" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
        <p class="mt-4 text-gray-600">Загрузка базы знаний...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="p-6 text-center text-red-600">
        Ошибка загрузки данных
      </div>

      <!-- Works Tab -->
      <div
        v-else-if="activeTab === 'works'"
        class="max-h-[600px] overflow-y-auto"
      >
        <div
          v-for="work in filteredWorks"
          :key="work.id"
          class="p-4 border-b hover:bg-gray-50"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-gray-900">
                {{ work.author }}: {{ work.title }}
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Отрывков: {{ work.excerpts?.length || 0 }}
              </p>
            </div>
            <NuxtLink
              :to="`/admin/materials/${work.id}`"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Подробнее →
            </NuxtLink>
          </div>

          <!-- Excerpts Preview -->
          <div v-if="work.excerpts?.length" class="mt-3 space-y-2">
            <div
              v-for="(excerpt, i) in work.excerpts.slice(0, 3)"
              :key="excerpt.id"
              class="text-sm bg-gray-50 p-2 rounded"
            >
              <span class="text-xs text-gray-400">Отрывок {{ i + 1 }}:</span>
              <p class="text-gray-600 line-clamp-1">
                {{ excerpt.text?.substring(0, 100) }}...
              </p>
            </div>
            <p v-if="work.excerpts.length > 3" class="text-xs text-gray-400">
              + ещё {{ work.excerpts.length - 3 }} отрывков
            </p>
          </div>
        </div>

        <div
          v-if="filteredWorks.length === 0"
          class="text-center py-12 text-gray-500"
        >
          Произведения не найдены
        </div>
      </div>

      <!-- Poets Tab -->
      <div
        v-else-if="activeTab === 'poets'"
        class="max-h-[600px] overflow-y-auto"
      >
        <div
          v-for="poet in filteredPoets"
          :key="poet.id"
          class="p-4 border-b hover:bg-gray-50"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-gray-900">{{ poet.name }}</h3>
              <p class="text-sm text-gray-500 mt-1">
                Стихотворений: {{ poet.poems?.length || 0 }}
              </p>
            </div>
          </div>

          <!-- Poems Preview -->
          <div v-if="poet.poems?.length" class="mt-3 space-y-2">
            <div
              v-for="poem in poet.poems.slice(0, 3)"
              :key="poem.id"
              class="text-sm bg-gray-50 p-2 rounded"
            >
              <p class="font-medium text-gray-800">{{ poem.title }}</p>
              <p class="text-gray-600 line-clamp-1">
                {{ poem.text?.substring(0, 100) }}...
              </p>
            </div>
            <p v-if="poet.poems.length > 3" class="text-xs text-gray-400">
              + ещё {{ poet.poems.length - 3 }} стихотворений
            </p>
          </div>
        </div>

        <div
          v-if="filteredPoets.length === 0"
          class="text-center py-12 text-gray-500"
        >
          Поэты не найдены
        </div>
      </div>
    </div>
  </div>
</template>
