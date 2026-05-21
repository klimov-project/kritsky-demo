<script setup lang="ts">
const {
  variant,
  selectedWorkId,
  selectedExcerptId,
  selectedChapter,
  selectedPoetId,
  selectedPoemId,
  selectedThemeId,
  refreshLoadingByBlock,
  isInitialLoading,
} = useVariantState();

const { pending: kbPending } = useKnowledgeBase();

const { generateVariant, refreshBlock } = useGenerateVariant();

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
      selectedChapter.value = excerpt?.chapter || '';
      selectedExcerptId.value = excerpt?.title || '';
    }

    if (newVariant?.poem) {
      const { poem, poet } = newVariant;
      selectedPoetId.value = poet?.id || '';
      selectedPoemId.value = poem?.title || '';
      selectedThemeId.value = poem?.themeInternalId || '';
    }
  },
  { immediate: true },
);

const isLoading = computed(
  () =>
    kbPending.value ||
    isInitialLoading.value ||
    refreshLoadingByBlock.value.block1,
);

const manualUpdateWork = (workId: string) => {
  selectedWorkId.value = workId;
  selectedChapter.value = 'Выберите главу';
  selectedExcerptId.value = 'Выберите отрывок';
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
  <div class="max-w-6xl w-full bg-white rounded-[10px] mb-3 p-4">
    <VariantExcerptFilters
      :selected-work-id="selectedWorkId"
      :selected-chapter="selectedChapter"
      :selected-excerpt-id="selectedExcerptId"
      :is-loading="isLoading"
      @update:selected-work-id="manualUpdateWork"
      @update:selected-chapter="manualUpdateChapter"
      @update:selected-excerpt-id="selectedExcerptId = $event"
      @refresh-block-1="refreshBlock('block1')"
    />
  </div>

  <div id="variant-content" class="max-w-6xl mb-[30px]">
    <div v-if="isLoading" class="text-center py-20">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
      ></div>
      <p class="mt-4 text-gray-600">Подготовка варианта...</p>
    </div>

    <ClientOnly v-else>
      <div v-if="!variant" class="bg-white rounded-lg shadow p-6 text-center">
        <p class="text-gray-600">
          Нет данных для отображения. Нажмите "Новый вариант" для генерации.
        </p>
      </div>

      <div v-else>
        <VariantExcerpt
          :excerpt-text="variant.excerpt?.text"
          :excerpt-author="variant.work?.author"
          :excerpt-work="variant.work?.title"
        />

        <VariantTaskList1 />

        <VariantTaskList2 />
      </div>
    </ClientOnly>

    <div class="max-w-6xl w-full bg-white rounded-[10px] mb-3 p-4">
      <VariantPoemFilters
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

    <div v-if="isLoading" class="text-center py-20">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
      ></div>
      <p class="mt-4 text-gray-600">Подготовка варианта...</p>
    </div>

    <ClientOnly v-if="variant">
      <VariantPoem
        :poem-text="variant.poem?.text"
        :poet-name="variant.poet?.name"
        :poem-title="variant.poem?.title"
      />
      <VariantTaskList3 />
      <VariantTaskList4 />
    </ClientOnly>
    <VariantCreatePartTwo />
    <div v-if="isLoading" class="text-center py-20">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
      ></div>
      <p class="mt-4 text-gray-600">Подготовка варианта...</p>
    </div>
    <ClientOnly v-if="variant">
      <VariantTaskList5 />
    </ClientOnly>
  </div>

  <VariantSidebar />
  <VariantFooter :block-btns="isLoading" />
</template>
