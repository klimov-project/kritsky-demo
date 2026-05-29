<script setup lang="ts">
const { settings } = useKnowledgeBase();
const shortTasks = ['task1', 'task2', 'task3'];
</script>

<template>
  <section class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px_50px_30px]">
    <VariantPdfTaskInstruction>
      {{ settings.variantTexts.part1QuestionsIntro }}
    </VariantPdfTaskInstruction>
    <VariantPdfTask
      v-for="taskKey in shortTasks"
      :key="taskKey"
      :task-key="taskKey"
    />
  </section>
</template>
