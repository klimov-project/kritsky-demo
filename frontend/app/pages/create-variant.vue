<script setup lang="ts">
import { useKnowledgeBase } from '~/composables/useKnowledgeBase';
const config = useRuntimeConfig();

const apiUrl = import.meta.server ? config.apiBackendUrl : config.public.apiUrl;

// Fetch knowledge base
const { kbStore, loadKnowledgeBase } = useKnowledgeBase();
loadKnowledgeBase();
const { isLoading: kbPending, error: kbError } = storeToRefs(kbStore);
// Fetch pregenerated variant
const variantUrl = `${apiUrl}/variants/runtime/pregenerated`;

const {
  data: variantData,
  pending: variantPending,
  error: variantError,
  refresh: refreshVariant,
} = await useFetch<any>(variantUrl, {
  server: false,
  lazy: true,
  cache: 'no-store',
});

// State
const selectedWorkId = ref('');
const selectedExcerptId = ref('');
const selectedChapter = ref('');
const showAnswers = ref<Record<string, boolean>>({});
const isRefreshing = ref(false);
// Computed
const works = computed(() => kbStore.works || []);
const poets = computed(() => kbStore.poets || []);
const variant = computed(() => variantData.value?.variant || null);
const isLoading = computed(() => kbPending.value || variantPending.value);
const hasError = computed(() => kbError.value || variantError.value);

const selectedWork = computed(() => {
  return works.value.find((w: any) => w.id === selectedWorkId.value);
});

const excerptChapters = computed(() => {
  if (!selectedWork.value) return [];
  // Simple implementation - extract unique chapters from excerpts
  const chapters = new Set<string>();
  selectedWork.value.excerpts?.forEach((excerpt: any) => {
    if (excerpt.chapter) chapters.add(excerpt.chapter);
  });
  return Array.from(chapters);
});

const excerptDropdownOptions = computed(() => {
  if (!selectedWork.value) return [];
  return (
    selectedWork.value.excerpts?.map((excerpt: any, i: number) => ({
      value: excerpt.id,
      label: `Отрывок ${i + 1}${
        excerpt.chapter ? ` (${excerpt.chapter})` : ''
      }`,
    })) || []
  );
});

// Task arrays
const shortTasks = ['task1', 'task2', 'task3', 'task4', 'task5'];
const longTasks = [
  'task6',
  'task7',
  'task8',
  'task9',
  'task10',
  'task11',
  'task12',
  'task13',
  'task14',
  'task15',
  'task16',
];

// Methods
const toggleAnswer = (taskKey: string) => {
  showAnswers.value[taskKey] = !showAnswers.value[taskKey];
};

const handleRefreshVariant = async () => {
  isRefreshing.value = true;
  try {
    await refreshVariant();
  } finally {
    isRefreshing.value = false;
  }
};

const refreshBlock1 = async () => {
  // Stub - refresh excerpt and tasks 1-5
  await handleRefreshVariant();
};

const formatAnswer = (answer: any) => {
  if (Array.isArray(answer)) {
    return answer.join(', ');
  }
  return answer || 'Нет ответа';
};

const getTaskNumber = (key: string) => {
  return key.replace('task', '');
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Page Header -->
    <div class="bg-white border-b">
      <div class="max-w-6xl mx-auto px-4 py-4">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Конструктор вариантов ЕГЭ
            </h1>
            <p class="text-sm text-gray-600 mt-1">
              Генерируйте уникальные варианты для подготовки к экзамену
            </p>
          </div>
          <div class="flex gap-3">
            <button
              @click="handleRefreshVariant"
              :disabled="isRefreshing || isLoading"
              class="bg-[#bd5343] hover:bg-[#ab4a3c] text-white px-4 py-2 rounded-[50px] font-medium transition flex items-center gap-2 uppercase"
            >
              <span v-if="isRefreshing" class="animate-spin">↻</span>
              {{ isRefreshing ? 'Генерация...' : 'Новый вариант' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex gap-6">
        <!-- Sidebar -->
        <NewTestSidebar
          :works="works"
          :selected-work-id="selectedWorkId"
          :selected-chapter="selectedChapter"
          :selected-excerpt-id="selectedExcerptId"
          :selected-work="selectedWork"
          :excerpt-chapters="excerptChapters"
          :excerpt-dropdown-options="excerptDropdownOptions"
          :is-loading="isLoading"
          @update:selected-work-id="selectedWorkId = $event"
          @update:selected-chapter="selectedChapter = $event"
          @update:selected-excerpt-id="selectedExcerptId = $event"
          @refresh-block-1="refreshBlock1"
        />

        <!-- Main Variant Content -->
        <div class="flex-1 min-w-0">
          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-20">
            <div
              class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            ></div>
            <p class="mt-4 text-gray-600">Подготовка варианта...</p>
          </div>

          <!-- Error State -->
          <div
            v-else-if="hasError"
            class="bg-red-50 border border-red-200 rounded-lg p-6"
          >
            <p class="text-red-700">
              Ошибка загрузки данных. Пожалуйста, попробуйте позже.
            </p>
            <button
              @click="refreshVariant()"
              class="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Повторить загрузку
            </button>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="!variant"
            class="bg-white rounded-lg shadow p-6 text-center"
          >
            <p class="text-gray-600">
              Нет данных для отображения. Нажмите "Новый вариант" для генерации.
            </p>
          </div>

          <!-- Variant Content -->
          <div v-else class="space-y-8">
            <!-- Variant Header -->
            <NewTestVariantHeader />

            <!-- Excerpt Text -->
            <NewTestExcerpt
              :excerpt-text="variant.excerpt?.text"
              :excerpt-author="variant.excerpt?.author"
              :excerpt-work="variant.excerpt?.work"
            />

            <!-- Tasks Section -->
            <NewTestTaskList
              title="Задания 1–5"
              :task-keys="shortTasks"
              :variant="variant"
              :show-answers="showAnswers"
              @toggle-answer="toggleAnswer"
            />

            <!-- Part 2 -->
            <NewTestTaskList
              title="Часть 2. Задания с развёрнутым ответом"
              :task-keys="longTasks"
              :variant="variant"
              :show-answers="showAnswers"
              @toggle-answer="toggleAnswer"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.prose p {
  margin-bottom: 0.5rem;
}
</style>
