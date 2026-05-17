<script setup lang="ts">
const showLiteraryQuestions = ref(true);
const showTermQuestions = ref(true);
</script>

<template>
  <div class="flex flex-row items-center gap-[50px]">
    <BaseCheckbox
      v-model="showLiteraryQuestions"
      label="Вопросы о произведении"
    />

    <BaseCheckbox v-model="showTermQuestions" label="Вопросы о терминах" />
  </div>
</template>
