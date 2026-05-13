<script setup lang="ts">
import type { Work, Poet } from '@/types/knowledgeBaseTypes';
import { useKnowledgeBase } from '~/composables/useKnowledgeBase';

const {
  variant,
  selectedWorkId,
  selectedExcerptId,
  selectedChapter,
  selectedPoetId,
  selectedPoemId,
  selectedThemeId,
  refreshLoadingByBlock,
  statusMessage,
  isInitialLoading,
} = useVariantState();

const {
  store: kbStore,
  pending: kbPending,
  error: kbError,
} = useKnowledgeBase();

const { refreshBlock } = useGenerateVariant();

const works = computed(() => (kbStore.works ?? []) as Work[]);
const poets = computed(() => (kbStore.poets ?? []) as Poet[]);
const knowledgeBase = computed(() => kbStore.knowledgeBase ?? {});
// Преобразуем poets в формат для USelect
const poetsOptions = computed(() => {
  return poets.value.map((poet) => ({
    value: String(poet.id ?? poet.authorId ?? poet.name ?? ''),
    label: poet.name,
  }));
});

const selectedPoet = computed(() =>
  poets.value.find((p) => p.authorId === selectedPoetId.value),
);

const poemsOptions = computed(() => {
  if (!selectedPoet.value) return [];
  return (
    selectedPoet.value.poems?.map((poem: any) => ({
      value: poem.poemId,
      label: poem.title,
    })) || []
  );
});

// Initial fetch logic
onMounted(async () => {
  // if (!variant.value) {
  //   await generateVariant();
  // }
  // isInitialLoading.value = false;
});

// Watcher to update filters based on variant data
watch(
  variant,
  (newVariant) => {
    if (newVariant?.excerpt) {
      const { excerpt } = newVariant;
      selectedWorkId.value = newVariant.work?.id || '';
      selectedChapter.value = excerpt.chapter || '';
      selectedExcerptId.value = excerpt.title || '';
    }

    if (newVariant?.poem && newVariant?.poet) {
      const { poem, poet } = newVariant;
      console.log({ poem, poet });
      selectedPoetId.value = poet?.authorId || '';
      selectedPoemId.value = poem.poemId || '';
      selectedThemeId.value = poem?.themeInternalId || '';
    }
    console.log(knowledgeBase.value);
    console.log(newVariant);
  },
  { immediate: true },
);

const isLoading = computed(
  () =>
    kbPending.value ||
    isInitialLoading.value ||
    refreshLoadingByBlock.value.block1,
);
// const hasError = computed(() => !!kbError.value || !!statusMessage.value);

const selectedWork = computed(() =>
  works.value.find((w) => w.id === selectedWorkId.value),
);

const excerptChaptersOptions = computed(() => {
  if (!selectedWork.value) return [];
  const chapters = new Set<string>();
  selectedWork.value.excerpts?.forEach((excerpt: any) => {
    if (excerpt.chapter) chapters.add(excerpt.chapter);
  });
  return Array.from(chapters);
});

const excerptDropdownOptions = computed(() => {
  if (!selectedWork.value) return [];
  const filteredExcerpts = selectedChapter.value
    ? selectedWork.value.excerpts?.filter(
        (excerpt: any) => excerpt.chapter === selectedChapter.value,
      )
    : selectedWork.value.excerpts;
  return (
    filteredExcerpts?.map((excerpt: any, i: number) => ({
      value: excerpt?.title || excerpt.id,
      label: excerpt?.title || `Отрывок ${i + 1} (${excerpt.chapter})`,
    })) || []
  );
});

const manualUpdateWork = (workId: string) => {
  selectedWorkId.value = workId;
  selectedChapter.value = '';
  selectedExcerptId.value = '';
};

const manualUpdateChapter = (chapterTitle: string) => {
  selectedChapter.value = chapterTitle;
  selectedExcerptId.value = '';
};

const manualUpdatePoet = (poetId: string) => {
  selectedPoetId.value = poetId;
  selectedPoemId.value = '';
};

const manualUpdatePoem = (poemId: string) => {
  selectedPoemId.value = poemId;
};
</script>

<template>
  <VariantSidebar />

  <div class="max-w-6xl w-full bg-white rounded-[10px] mb-3 p-4">
    <VariantExcerptFilters
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
      @refresh-block-1="refreshBlock('block1')"
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
        class="bg-red-50 border border-red-200 rounded-lg p-6 mb-3"
      >
        <p class="text-red-700">
          {{
            statusMessage ||
            'Ошибка загрузки данных. Пожалуйста, попробуйте позже.'
          }}
        </p>
        <button
          @click="generateVariant"
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
      <div v-else>
        <!-- Excerpt  -->
        <VariantExcerpt
          :excerpt-text="variant.excerpt?.text"
          :excerpt-author="variant.work?.author"
          :excerpt-work="variant.work?.title"
        />

        <!-- Tasks Part 1 -->
        <VariantTaskList1 />

        <!-- Tasks Part 2 -->
        <VariantTaskList2 />
      </div>
    </ClientOnly>

    <div class="max-w-6xl w-full bg-white rounded-[10px] mb-3 p-4">
      <VariantPoemFilters
        :poets="poetsOptions"
        :poems="poemsOptions"
        :selected-poet-id="selectedPoetId"
        :selected-poem-id="selectedPoemId"
        :selected-theme-id="selectedThemeId"
        :is-loading="isLoading"
        @update:selected-poet-id="manualUpdatePoet"
        @update:selected-poem-id="manualUpdatePoem"
        @update:selected-theme-id="selectedThemeId = $event"
        @refresh-block-2="refreshBlock('block2')"
      />
    </div>
  </div>
</template>
