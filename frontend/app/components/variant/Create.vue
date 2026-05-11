<script setup lang="ts">
import type { Work } from '@/types/knowledgeBaseTypes';
import { useKnowledgeBase } from '~/composables/useKnowledgeBase';

const config = useRuntimeConfig();
const { setVariant } = useVariant();
const {
  store: kbStore,
  pending: kbPending,
  error: kbError,
} = useKnowledgeBase();

// Fetch pregenerated variant
const apiUrl = import.meta.server ? config.apiBackendUrl : config.public.apiUrl;
// const apiUrl = import.meta.server
//   ? config.apiBackendUrl
//   : 'http://localhost:8000/api';
const variantUrl = `${apiUrl}/variants/runtime/pregenerated`;

const {
  data: variantData,
  pending: variantPending,
  error: variantError,
  refresh: refreshVariant,
} = useLazyFetch<any>(variantUrl, {
  server: false,
  default: () => null,
});

// State
const selectedWorkId = ref('');
const selectedExcerptId = ref('');
const selectedChapter = ref('');
const showAnswers = ref<Record<string, boolean>>({});
const isRefreshing = ref(false);

const works = computed(() => (kbStore.works ?? []) as Work[]);
const variant = computed(() => variantData.value?.variant ?? null);
setVariant(variant.value);

// Watcher to update filters based on variant data
watch(variant, (newVariant) => {
  setVariant(newVariant);
  console.log('ПРОИЗВЕДЕНИЕ : ', newVariant?.work?.title);
  console.log('Отрывок : ', newVariant?.excerpt?.title);

  if (newVariant?.excerpt) {
    const { excerpt } = newVariant;
    console.log('Глава: ', excerpt.chapter);

    // selectedWorkId.value = newVariant.work?.id || excerpt?.workId || '';
    selectedWorkId.value = newVariant.work?.id || '';
    selectedChapter.value = excerpt.chapter || '';
    selectedExcerptId.value = excerpt.title || '';
    console.log('selectedChapter.value ', selectedChapter.value);
    console.log('selectedExcerptId.value ', selectedExcerptId.value);
    console.log('excerpt ', excerpt);
  }
});

const isLoading = computed(() => kbPending.value || variantPending.value);
const hasError = computed(() => !!kbError.value || !!variantError.value);

const selectedWork = computed(() =>
  works.value.find((w) => w.id === selectedWorkId.value),
);

const excerptChaptersOptions = computed(() => {
  if (!selectedWork.value) return [];
  const chapters = new Set<string>();
  selectedWork.value.excerpts?.forEach((excerpt: any) => {
    if (excerpt.chapter) chapters.add(excerpt.chapter);
  });
  const chaptersArray = Array.from(chapters);
  return chaptersArray;
});

const excerptDropdownOptions = computed(() => {
  if (!selectedWork.value) return [];
  const filteredExcerpts = selectedChapter.value
    ? selectedWork.value.excerpts?.filter(
        (excerpt: any) => excerpt.chapter === selectedChapter.value,
      )
    : selectedWork.value.excerpts;
  const options =
    filteredExcerpts?.map((excerpt: any, i: number) => ({
      value: excerpt?.title || excerpt.id,
      label: excerpt?.title || `Отрывок ${i + 1} (${excerpt.chapter})`,
    })) || [];
  return options;
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

const manualUpdateWork = async (workTitle: string) => {
  selectedWorkId.value = workTitle;

  selectedChapter.value = '';
  selectedExcerptId.value = '';
};

const manualUpdateChapter = async (chapterTitle: string) => {
  selectedChapter.value = chapterTitle;
  selectedExcerptId.value = '';
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
  <VariantSidebar />

  <div class="max-w-6xl w-full bg-white rounded-[10px] mb-3 p-4">
    <VariantFilters
      :works="works"
      :selected-work-id="selectedWorkId"
      :selected-chapter="selectedChapter"
      :selected-excerpt-id="selectedExcerptId"
      :selected-work="selectedWork"
      :excerpt-chapters="excerptChaptersOptions"
      :excerpt-dropdown-options="excerptDropdownOptions"
      :is-loading="isLoading"
      @update:selected-work-id="manualUpdateWork"
      @update:selected-chapter="manualUpdateChapter"
      @update:selected-excerpt-id="selectedExcerptId = $event"
      @refresh-block-1="handleRefreshVariant"
    />
  </div>

  <div class="max-w-6xl">
    <!-- Loading  -->
    <div v-if="isLoading" class="text-center py-20">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
      ></div>
      <p class="mt-4 text-gray-600">Подготовка варианта...</p>
    </div>

    <ClientOnly v-else>
      <!-- Error -->
      <div
        v-if="hasError"
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

      <!-- Empty -->
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
        <!-- Excerpt  -->
        <VariantExcerpt
          :excerpt-text="variant.excerpt?.text"
          :excerpt-author="selectedWork?.author"
          :excerpt-work="selectedWork?.title"
        />

        <!-- Tasks Section -->
        <VariantTasks1
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
    </ClientOnly>
  </div>
</template>
