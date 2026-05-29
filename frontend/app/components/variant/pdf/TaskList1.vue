<script setup lang="ts">
const { settings } = useKnowledgeBase();
const shortTasks = ['task1', 'task2', 'task3'];
</script>

<template>
  <section class="tasks-section-1">
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
