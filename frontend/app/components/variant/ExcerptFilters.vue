<script setup lang="ts">
import type { Work } from '@/types/knowledgeBaseTypes';

interface Props {
  selectedWorkId: string
  selectedChapter: string
  selectedExcerptId: string
  isLoading: boolean
}

const props = defineProps<Props>()

const { store: kbStore } = useKnowledgeBase();

const { isAuthenticated, openLoginModal } = useAuth();

const isAuthLock = computed(() => !isAuthenticated.value)

const isLockIcon = computed(()=> isAuthLock.value ? "i-lucide:lock" : '')

const emit = defineEmits<{
  'update:selected-work-id': [value: string]
  'update:selected-chapter': [value: string]
  'update:selected-excerpt-id': [value: string]
  'refresh-block-1': []
}>()

const selectedWorkId = computed({
  get: () => props.selectedWorkId,
  set: (value) => emit('update:selected-work-id', value)
})

const selectedChapter = computed({
  get: () => props.selectedChapter,
  set: (value) => emit('update:selected-chapter', value)
})

const selectedExcerptId = computed({
  get: () => props.selectedExcerptId,
  set: (value) => emit('update:selected-excerpt-id', value)
})



const works = computed(() => (kbStore.works ?? []) as Work[]);
const selectedWork = computed(() =>
  works.value.find((w) => w.id === selectedWorkId.value),
);
const disabledWorks = computed(() => works.value.length === 0)
const disabledChapter = computed(() => excerptChaptersOptions.value.length === 0)
const disabledExcerpt = computed(() => excerptDropdownOptions.value.length === 0 || isAuthLock.value)


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

// Преобразуем works в формат для USelect
const workOptions = computed(() => {
  const options =  works.value.map(work => ({
    value: work.id,
    label: `${work.author} — ${work.title}`,
    author: work.author,
  }));
  return options;
})
</script>

<template>
  <div class="create-variant-filters p-6 rounded-lg">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="w-full">
        <label
          class="block text-base font-medium uppercase tracking-wider mb-2 text-toned"
        >
          Произведение
        </label>
        <USelect
          v-model="selectedWorkId"
          :items="workOptions"
          :disabled="disabledWorks"
          placeholder="Выберите произведение"
          class="w-full"
        />
      </div>

      <div>
        <label
          class="block text-base font-medium text-toned uppercase tracking-wider mb-2"
        >
          Глава
        </label>
        <USelect
          v-model="selectedChapter"
          :items="excerptChaptersOptions"
          :disabled="disabledChapter"
          placeholder="Нет глав"
          class="w-full"
        />
      </div>

      <div class="md:col-span-2">
        <label
          class="block text-base font-medium text-toned uppercase tracking-wider mb-2"
        >
          Отрывок
        </label>
        <AuthBtnWrap>
          <USelect
            v-model="selectedExcerptId"
            :items="excerptDropdownOptions"
            :disabled="disabledExcerpt"
            :icon="isLockIcon"
            placeholder="Выберите отрывок"
            class="w-full"
          />
        </AuthBtnWrap>
      </div>
    </div>

    <!-- Отладочная информация -->
    <div v-if="false" class="mt-4 text-base text-gray-500">
      <div>Всего произведений: {{ works.length }}</div>
      <div>Выбранное произведение: {{ selectedWorkId }}</div>
      <div v-if="selectedWork">Автор: {{ selectedWork?.author }}</div>
    </div>

    <div class="pt-7 flex justify-center items-center">
      <BaseButton
        @click="$emit('refresh-block-1')"
        :loading="isLoading"
        :disabled="isLoading"
        :isLocked="isAuthLock"
        class="update-variant-btn__filter"
      >
        Обновить отрывок и задания 1–5
      </BaseButton>
    </div>
  </div>
</template>
<style lang="scss">
.create-variant-filters {
  button[data-slot='base']:not(.update-variant-btn__filter) {
    --tw-ring-color: #cfcfcf;
    padding: 15px 24px;
    background-color: #ffffff;
    border-radius: 10px;
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 20px;
    [data-slot='leading'] {
      padding: 0 24px;
    }
    [data-slot='leading'] + [data-slot='value'] {
      margin-left: 36px;
    }
  }
}
</style>
