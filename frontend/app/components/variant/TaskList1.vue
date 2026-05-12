<script setup lang="ts">
const shortTasks = ['task1', 'task2', 'task3'];
</script>

<template>
  <section class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px_50px_30px]">
    <VariantTaskInstruction>
      Ответами к заданиям 1-3 являются одно-два слова или последовательность
      цифр.
    </VariantTaskInstruction>
    <VariantTask
      v-for="taskKey in shortTasks"
      :key="taskKey"
      :task-key="taskKey"
    />
  </section>
</template>
