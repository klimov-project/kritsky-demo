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
  <div class="p-6 rounded-lg">
    <div class="space-y-4 grid grid-cols-1 md:grid-cols-2">
      <!-- Произведение -->
      <div class="w-full">
        <label
          class="block text-base font-medium uppercase tracking-wider mb-2 text-toned"
        >
          Произведение
        </label>
        <USelect
          v-model="selectedWorkId"
          :items="workOptions"
          option-attribute="label"
          value-attribute="value"
          placeholder="Все произведения"
          class="w-full"
        >
          <!-- Кастомное отображение элемента в селекте -->

          <!-- Кастомное отображение выбранного элемента -->
          <template #selected="{ selected }">
            <div class="flex items-center justify-between w-full">
              <span>{{ selected?.label || 'Все произведения' }}</span>
              <span
                v-if="selected?.author"
                class="text-base text-gray-400 ml-2"
              >
                {{ selected.author }}
              </span>
            </div>
          </template>
        </USelect>
      </div>

      <!-- Глава -->
      <div>
        <label
          class="block text-base font-medium text-toned uppercase tracking-wider mb-2"
        >
          Глава
        </label>
        <USelect
          v-model="selectedChapter"
          :items="excerptChapters"
          placeholder="Все главы"
          class="w-full"
        />
      </div>

      <!-- Отрывок -->
      <div class="md:col-span-2">
        <label
          class="block text-base font-medium text-toned uppercase tracking-wider mb-2"
        >
          Отрывок
        </label>
        <USelect
          v-model="selectedExcerptId"
          :items="excerptDropdownOptions"
          option-attribute="label"
          value-attribute="value"
          placeholder="Выберите отрывок"
          class="w-full"
        />
      </div>
    </div>

    <!-- Отладочная информация (можно удалить) -->
    <div v-if="false" class="mt-4 text-base text-gray-500">
      <div>Всего произведений: {{ works.length }}</div>
      <div>Выбранное произведение: {{ selectedWorkId }}</div>
      <div v-if="selectedWork">Автор: {{ selectedWork.author }}</div>
    </div>

    <!-- Кнопка действия -->
    <div class="pt-6 mt-6 border-t border-default">
      <UButton
        @click="$emit('refresh-block-1')"
        :loading="isLoading"
        :disabled="isLoading"
        block
        size="lg"
        class="rounded-[50px]"
      >
        Обновить отрывок и задания 1–5
      </UButton>
    </div>
  </div>
</template>
