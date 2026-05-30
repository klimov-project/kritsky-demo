<script setup lang="ts">
const props = defineProps<{
  answer: string;
}>();

const isAnswerVisible = ref(false);

const toggleAnswer = () => {
  isAnswerVisible.value = !isAnswerVisible.value;
};
</script>

<template>
  <div class="flex justify-start mt-2 no-print">
    <BaseButton @click="toggleAnswer">
      {{ isAnswerVisible ? 'Скрыть ответ' : 'Показать ответ' }}
    </BaseButton>
  </div>
  <div
    v-if="isAnswerVisible"
    class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
  >
    <span class="text-sm font-medium text-green-800">Ответ:</span>
    <span class="text-sm text-green-700 ml-2">
      {{ answer }}
    </span>
  </div>
</template>
