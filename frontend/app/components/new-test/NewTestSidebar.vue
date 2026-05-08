<script setup lang="ts">
interface Props {
  works: any[]
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
</script>

<template>
  <aside class="hidden lg:block w-64 flex-shrink-0">
    <div class="bg-white rounded-lg shadow p-4 sticky top-20">
      <nav class="space-y-2 mb-6">
        <button
          class="w-full text-left px-3 py-2 rounded bg-blue-50 text-blue-700 font-medium text-sm"
        >
          Весь вариант
        </button>
        <button
          class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-sm"
        >
          Только отрывок
        </button>
        <button
          class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-sm"
        >
          Только стихотворение
        </button>
      </nav>

      <!-- Filters -->
      <div class="space-y-4">
        <div>
          <label
            class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2"
          >
            Произведение
          </label>
          <select
            v-model="selectedWorkId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все произведения</option>
            <option v-for="work in works" :key="work.id" :value="work.id">
              {{ work.author }} — {{ work.title }}
            </option>
          </select>
        </div>

        <div v-if="selectedWork">
          <label
            class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2"
          >
            Глава
          </label>
          <select
            v-model="selectedChapter"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все главы</option>
            <option
              v-for="(chapter, i) in excerptChapters"
              :key="chapter"
              :value="chapter"
            >
              {{ i + 1 }}. {{ chapter }}
            </option>
          </select>
        </div>

        <div>
          <label
            class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2"
          >
            Отрывок
          </label>
          <select
            v-model="selectedExcerptId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Выберите отрывок</option>
            <option
              v-for="excerpt in excerptDropdownOptions"
              :key="excerpt.value"
              :value="excerpt.value"
            >
              {{ excerpt.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-4 border-t mt-4">
        <button
          @click="$emit('refresh-block-1')"
          :disabled="isLoading"
          class="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
        >
          Обновить отрывок и задания 1–5
        </button>
      </div>

      <div class="pt-4">
        <a
          href="mailto:support@kritsky.academy"
          class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
            />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Обратная связь
        </a>
      </div>
    </div>
  </aside>
</template>
