<script setup lang="ts">
const { settings } = useKnowledgeBase();
const customTasks = ['task6', 'task7', 'task8'];
</script>

<template>
  <section class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px]">
    <VariantTaskInstruction>
      {{ settings.variantTexts.part2QuestionsIntro }}
    </VariantTaskInstruction>
    <VariantTask
      v-for="taskKey in customTasks"
      :key="taskKey"
      :task-key="taskKey"
    />
  </section>
</template>
