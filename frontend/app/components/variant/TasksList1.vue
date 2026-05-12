<script setup lang="ts">
interface Props {
  taskKeys: string[];
  variant: any;
  showAnswers: Set<string> | Record<string, boolean>;
}

const props = defineProps<Props>();
const variant = useCurrentVariant();

const getTaskNumber = (key: string) => {
  return key.replace('task', '');
};
</script>

<template>
  <section class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px_50px_30px]">
    <div>
      <VariantTaskInstruction>
        Ответами к заданиям 1-3 являются одно-два слова или последовательность
        цифр.
      </VariantTaskInstruction>
      <VariantTask
        v-for="taskKey in taskKeys"
        :key="taskKey"
        :task-number="getTaskNumber(taskKey)"
        :task-text="variant?.[taskKey]?.text"
        :answer="variant?.[taskKey]?.answer"
      />
    </div>
  </section>
</template>
