<script setup lang="ts">
interface Props {
  excerptText?: string;
  excerptAuthor?: string;
  excerptWork?: string;
}

defineProps<Props>();
</script>
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="prose prose-sm max-w-none mb-4">
      <p v-html="excerptText || 'Текст отрывка будет отображаться здесь.'"></p>
    </div>
    <div class="flex justify-end">
      <p class="text-sm font-semibold text-gray-600">
        — {{ excerptAuthor }}, «{{ excerptWork }}»
      </p>
    </div>
  </div>
</template>
