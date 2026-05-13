<script setup lang="ts">
const customTasks = ['task6', 'task7', 'task8'];
</script>

<template>
  <section class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px_50px_30px]">
    <VariantTaskInstruction>
      Ответами к заданиям 6-8 являются одно-два слова или последовательность
      цифр.
    </VariantTaskInstruction>
    <VariantTask
      v-for="taskKey in customTasks"
      :key="taskKey"
      :task-key="taskKey"
    />
  </section>
</template>
