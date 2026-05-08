<script setup lang="ts">
interface Props {
  taskNumber: string;
  taskText?: string;
  answer?: any;
  showAnswer: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'toggle-answer': [];
}>();

const formattedAnswer = computed(() => {
  if (Array.isArray(props.answer)) {
    return props.answer.join(', ');
  }
  return props.answer || 'Нет ответа';
});
</script>
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-start gap-4">
      <span
        class="bg-gray-800 text-white px-3 py-1 text-sm font-bold rounded flex-shrink-0"
      >
        {{ taskNumber }}
      </span>
      <div class="flex-1 min-w-0">
        <div
          class="prose prose-sm max-w-none"
          v-html="taskText || 'Вопрос не задан'"
        ></div>
        <div class="mt-4 pt-4 border-t">
          <button
            @click="$emit('toggle-answer')"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {{ showAnswer ? 'Скрыть ответ' : 'Показать ответ' }}
          </button>
          <div
            v-if="showAnswer"
            class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <span class="text-sm font-medium text-green-800">Ответ:</span>
            <span class="text-sm text-green-700 ml-2">
              {{ formattedAnswer }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
