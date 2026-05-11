<script setup lang="ts">
import type { Work } from '@/types/knowledgeBaseTypes';
interface Props {
  works: Work[]
  selectedWorkId: string
  selectedChapter: string
  selectedExcerptId: string
  selectedWork: any
  excerptChapters: string[]
  excerptDropdownOptions: { value: string; label: string }[]
  isLoading: boolean
}

const props = defineProps<Props>()

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


const disabledWorks = computed(() => props.works.length === 0)
const disabledChapter = computed(() => props.excerptChapters.length === 0)
const disabledExcerpt = computed(() => props.excerptDropdownOptions.length === 0)

// Преобразуем works в формат для USelect
const workOptions = computed(() => {
  return props.works.map(work => ({
    value: work.id,
    label: work.title,
    // Дополнительно можно добавить автора
    author: work.author,
    // Можно использовать слот для кастомного отображения
  }))
})

// Для отображения автора в селекте (если нужно)
const authorOptions = computed(() => {
  // Получаем уникальных авторов из works
  const uniqueAuthors = [...new Set(props.works.map(work => work.author))]
  return uniqueAuthors.map(author => ({
    value: author,
    label: author,
  }))
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
          :items="excerptChapters"
          :disabled="disabledChapter"
          placeholder="Все главы"
          class="w-full"
        />
      </div>

      <div class="md:col-span-2">
        <label
          class="block text-base font-medium text-toned uppercase tracking-wider mb-2"
        >
          Отрывок
        </label>
        <USelect
          v-model="selectedExcerptId"
          :items="excerptDropdownOptions"
          :disabled="disabledExcerpt"
          placeholder="Выберите отрывок"
          class="w-full"
        />
      </div>
    </div>

    <!-- Отладочная информация -->
    <div v-if="false" class="mt-4 text-base text-gray-500">
      <div>Всего произведений: {{ works.length }}</div>
      <div>Выбранное произведение: {{ selectedWorkId }}</div>
      <div v-if="selectedWork">Автор: {{ selectedWork.author }}</div>
    </div>

    <div class="pt-7 flex justify-center items-center">
      <UButton
        @click="$emit('refresh-block-1')"
        :loading="isLoading"
        :disabled="isLoading"
        block
        size="lg"
        class="update-variant-btn__filter w-auto h-[50px] whitespace-nowrap"
      >
        Обновить отрывок и задания 1–5
      </UButton>
    </div>
  </div>
</template>
<style lang="scss">
.create-variant-filters {
  button[data-slot='base'] {
    padding: 15px 24px;
    background-color: #ffffff;

    box-shadow: 0 0 0 1px #cfcfcf;
    --tw-ring-color: #cfcfcf;

    border-radius: 10px;
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 19px;
  }

  button.update-variant-btn__filter {
    background-color: #f6f6f6;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ui-text);
    padding: 20px 35px 18px;
    border: 0px solid;
    box-shadow: none;
    word-wrap: none;
    &:hover:not(:disabled) {
      background-color: #eeeeee;
    }
    :disabled,
    [disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
