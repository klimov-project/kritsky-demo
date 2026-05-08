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
</template>
