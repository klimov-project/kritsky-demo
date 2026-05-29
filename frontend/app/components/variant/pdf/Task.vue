<script setup lang="ts">
const props = defineProps<{
  taskKey: string;
}>();
const variant = useCurrentVariant();

const getTaskNumber = (key: string) => {
  return key.replace('task', '').replace(/_/g, '.');
};

const isEmpty = (html?: string) => {
  if (!html) return true;
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped === '';
};

// Данные текущего задания
const taskData = computed(() => variant.value?.[props.taskKey] || {});

const hasContent = computed(() => {
  if (taskData.value.part1 || taskData.value.part2) {
    return !isEmpty(taskData.value.part1) || !isEmpty(taskData.value.part2);
  }
  return !isEmpty(taskData.value.text || taskData.value.prompt);
});

// Определяем тип задания
const taskType = computed(() => {
  if (props.taskKey === 'task1') return 'task1';
  if (props.taskKey === 'task2') return 'task2';
  if (props.taskKey === 'task3') return 'task3';
  if (props.taskKey.startsWith('task4_')) return 'task4';
  if (props.taskKey === 'task5') return 'task5';
  if (props.taskKey === 'task6') return 'task6';
  if (props.taskKey === 'task7') return 'task7';
  if (props.taskKey === 'task8') return 'task8';
  if (props.taskKey.startsWith('task9_')) return 'task9';
  if (props.taskKey === 'task10') return 'task10';
  if (props.taskKey.startsWith('task11_')) return 'task11';
  return 'default';
});

// const hasTermQuestion = computed(() => taskData.value?.isTermQuestion === true);

const showAnswerStub = computed(() => {
  return !['task4', 'task5', 'task9', 'task10', 'task11'].includes(
    taskType.value,
  );
});
</script>

<template>
  <TaskPdfNumber :number="getTaskNumber(taskKey)" />
  <span v-if="!hasContent" class="font-normal not-italic text-xl ml-[55px]">
    Вопрос не задан
  </span>

  <!-- <div v-if="taskType === 'task1' && hasTermQuestion">
    <TaskTermQuestionToggles />
  </div> -->

  <!-- TASK 2 -->
  <template v-if="taskType === 'task2'">
    <TaskPdfText :prompt="taskData.prompt" />
    <TaskTwoColumns
      ref="taskColumnsRef"
      :left-label="taskData.leftLabel"
      :right-label="taskData.rightLabel"
      :pairs="taskData.pairs || []"
      :options="taskData.options || []"
    />
    <TaskAnswerStub />
  </template>

  <!-- TASK 3 / TASK 6 -->
  <template v-else-if="taskType === 'task3' || taskType === 'task6'">
    <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
      <TaskPdfText :part1="taskData.part1" :part2="taskData.part2" />
    </div>
    <TaskAnswerStub />
  </template>

  <!-- TASK 8 -->
  <template v-else-if="taskType === 'task8'">
    <div class="flex flex-col items-start gap-[10px] ml-[55px] mr-[55px]">
      <TaskPdfText :prompt="taskData.prompt" />
      <TaskOptionsList :options="variant?.task8Options || []" />
    </div>
    <TaskAnswerStub />
  </template>

  <!-- DEFAULT: task1, task4, task5, task7, task9, task10, task11 -->
  <template v-else>
    <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
      <TaskPdfText :text="taskData.text" />
    </div>
    <TaskAnswerStub v-if="showAnswerStub" />
  </template>
</template>

<style lang="scss">
.task-container {
  --tw-ring-color: #cfcfcf;
  --ui-border: #e2e8f0;
  transition: box-shadow 0.3s ease;
  .rounded-md {
    border-radius: 5px;
  }
  .base-btn {
    padding: 8px 15px;
    height: 30px;
  }
  .text-base > p {
    font-size: 20px !important;
  }
  .anchor-for-action:before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 280px;
    z-index: 10;
  }
  &:hover {
    --tw-ring-inset: inset;
    box-shadow: 0 0 0 2px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
    .anchor-for-action {
      z-index: 30;
      .task-action-btns {
        z-index: 31;
        button {
          box-shadow: 0 10px 15px -3px var(--tw-shadow-color, rgb(0 0 0 / 0.1)),
            0 4px 6px -4px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
        }
      }
    }
  }
}
</style>
