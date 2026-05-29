<script setup lang="ts">
const { settings } = useKnowledgeBase();
const customTasks = ['task6', 'task7', 'task8'];
</script>

<template>
  <section class="tasks-section-3">
    <VariantPdfTaskInstruction>
      {{ settings.variantTexts.part2QuestionsIntro }}
    </VariantPdfTaskInstruction>
    <VariantPdfTask
      v-for="taskKey in customTasks"
      :key="taskKey"
      :task-key="taskKey"
    />
  </section>
</template>
