<script setup lang="ts">
interface Props {
  title: string
  taskKeys: string[]
  variant: any
  showAnswers: Set<string> | Record<string, boolean>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'toggle-answer': [taskKey: string]
}>()

const toggleAnswer = (taskKey: string) => {
  emit('toggle-answer', taskKey)
}

const getTaskNumber = (key: string) => {
  return key.replace('task', '')
}
</script>

<template>
  <section>
    <h2
      class="text-lg font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-6"
    >
      {{ title }}
    </h2>

    <div class="space-y-6">
      <NewTestTask
        v-for="taskKey in taskKeys"
        :key="taskKey"
        :task-number="getTaskNumber(taskKey)"
        :task-text="variant?.[taskKey]?.text"
        :answer="variant?.[taskKey]?.answer"
        :show-answer="
          showAnswers instanceof Set
            ? showAnswers.has(taskKey)
            : showAnswers[taskKey] || false
        "
        @toggle-answer="toggleAnswer(taskKey)"
      />
    </div>
  </section>
</template>
