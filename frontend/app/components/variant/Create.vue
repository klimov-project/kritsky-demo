<script setup lang="ts">
import type { Work } from '@/types/knowledgeBaseTypes';
import { useKnowledgeBase } from '~/composables/useKnowledgeBase';

const config = useRuntimeConfig();
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

// Watcher to update filters based on variant data
watch(variant, (newVariant) => {
  console.log('ПРОИЗВЕДЕНИЕ : ', newVariant?.work?.title);
  console.log('Отрывок : ', newVariant?.excerpt?.title);
  console.log(' newVariant?.excerpt ? : ', newVariant?.excerpt);
  if (newVariant?.excerpt) {
    console.log('Глава: ', newVariant.excerpt.chapter);

    selectedWorkId.value =
      newVariant.work?.id || newVariant.excerpt?.workId || '';
    selectedChapter.value = newVariant.excerpt.chapter || '';
    selectedExcerptId.value =
      newVariant.excerpt.excerptId || newVariant.excerpt.id || '';
    console.log(
      'selectedWorkId: ' +
        selectedWorkId.value +
        '  ---- resolved work id: ' +
        (newVariant.work?.id || newVariant.excerpt?.workId),
    );
    console.log(
      'selectedChapter: ' +
        selectedChapter.value +
        '  ---- newVariant.excerpt.chapter: ' +
        newVariant.excerpt.chapter,
    );
    console.log(
      'selectedExcerptId: ' +
        selectedExcerptId.value +
        '  ---- newVariant.excerpt.excerptId: ' +
        newVariant.excerpt.excerptId,
    );
  }
});

const isLoading = computed(() => kbPending.value || variantPending.value);
const hasError = computed(() => !!kbError.value || !!variantError.value);

const selectedWork = computed(() =>
  works.value.find((w) => w.id === selectedWorkId.value),
);

watch(selectedWorkId, (newId, oldId) => {
  if (!oldId || newId === oldId) return;
  selectedChapter.value = '';
  selectedExcerptId.value = '';
});

watch(selectedChapter, (newChapter, oldChapter) => {
  if (newChapter === oldChapter) return;
  selectedExcerptId.value = '';
  if (selectedWork.value && newChapter) {
    const firstExcerpt = selectedWork.value.excerpts?.find(
      (excerpt: any) => excerpt.chapter === newChapter,
    );
    if (firstExcerpt) {
      selectedExcerptId.value = firstExcerpt.excerptId || firstExcerpt.id || '';
    }
  }
});

const excerptChapters = computed(() => {
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
      value: excerpt.excerptId || excerpt.id,
      label: `Отрывок ${i + 1}${
        excerpt.chapter ? ` (${excerpt.chapter})` : ''
      }`,
    })) || [];
  const foundExcerpt = selectedWork.value.excerpts?.find(
    (e: any) => e.id === selectedExcerptId.value,
  );
  console.log('foundExcerpt for selectedExcerptId:', foundExcerpt);
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
      :excerpt-chapters="excerptChapters"
      :excerpt-dropdown-options="excerptDropdownOptions"
      :is-loading="isLoading"
      @update:selected-work-id="selectedWorkId = $event"
      @update:selected-chapter="selectedChapter = $event"
      @update:selected-excerpt-id="selectedExcerptId = $event"
      @refresh-block-1="handleRefreshVariant"
    />
  </div>

  <div class="max-w-6xl mx-auto px-4 py-6">
    <div class="flex gap-6">
      <div class="flex-1 min-w-0">
        <!-- Loading state — показывается и на сервере, и на клиенте -->
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
        </ClientOnly>
      </div>
    </div>
  </div>
</template>
