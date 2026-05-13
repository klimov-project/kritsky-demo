<script setup lang="ts">
const props = defineProps<{
  taskKey: string;
}>();

const variant = useCurrentVariant();

const getTaskNumber = (key: string) => {
  return key.replace('task', '').replace(/_/g, '.');
};

const isOpen = ref(true);

const isEmpty = (html?: string) => {
  if (!html) return true;
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped === '';
};

defineShortcuts({
  o: () => (isOpen.value = !isOpen.value),
});

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

const hasTermQuestion = computed(() => taskData.value?.isTermQuestion === true);

const formattedAnswer = computed(() => {
  if (taskType.value === 'task3' || taskType.value === 'task6') {
    return [taskData.value?.answer1, taskData.value?.answer2]
      .filter(Boolean)
      .join(', ');
  }
  if (taskType.value === 'task8') {
    const options = variant.value?.task8Options || [];
    return options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.term)
      .join(', ');
  }
  if (Array.isArray(taskData.value?.answer)) {
    return taskData.value.answer.join(', ');
  }
  return taskData.value?.answer || 'Нет ответа';
});

const showAnswerStub = computed(() => {
  return !['task4', 'task5', 'task9', 'task10', 'task11'].includes(
    taskType.value,
  );
});

const showAnswerButton = computed(() => {
  return ['task1', 'task3', 'task6', 'task7', 'task8'].includes(taskType.value);
});
</script>

<template>
  <div
    class="task-container ring ring-inset ring-accented rounded-[10px] py-7 px-8 mb-3 relative"
  >
    <div
      class="absolute w-auto left-0 top-0 p-[30px] flex items-center justify-center"
    >
      <TaskNumber :number="getTaskNumber(taskKey)" />
    </div>
    <div
      v-if="!isOpen || !hasContent"
      class="h-[40px] flex items-center justify-between"
    >
      <span
        v-if="!isOpen && hasContent"
        class="font-normal not-italic text-xl ml-[55px]"
      >
        Задание скрыто
      </span>
      <span v-if="!hasContent" class="font-normal not-italic text-xl ml-[55px]">
        Вопрос не задан
      </span>
    </div>
    <UCollapsible v-model:open="isOpen">
      <div
        class="absolute w-auto top-0 right-0 p-[30px] flex items-center justify-center"
      >
        <TaskVisibilityToggle :is-task-open="isOpen" />
      </div>

      <template #content class="relative">
        <!-- Верхняя панель -->
        <!-- Чекбоксы (только для task1 с isTermQuestion) -->

        <div
          v-if="taskType === 'task1' && hasTermQuestion"
          class="flex items-start gap-[10px] ml-[55px] mr-[55px]"
        >
          <TaskTermQuestionToggles />
        </div>

        <!-- Основной контент задания -->
        <div class="flex-1 space-y-3">
          <!-- TASK 2 -->
          <template v-if="taskType === 'task2'">
            <div
              class="flex flex-col items-start gap-[10px] mb-4 ml-[55px] mr-[55px]"
            >
              <TaskText :prompt="taskData.prompt" />
              <TaskTwoColumns
                :left-label="taskData.leftLabel"
                :right-label="taskData.rightLabel"
                :pairs="taskData.pairs || []"
                :options="taskData.options || []"
              />
            </div>
            <TaskAnswerStub />
          </template>

          <!-- TASK 3 / TASK 6 -->
          <template v-else-if="taskType === 'task3' || taskType === 'task6'">
            <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
              <TaskText :part1="taskData.part1" :part2="taskData.part2" />
            </div>
            <TaskAnswerStub />
            <TaskAnswerToggle :answer="formattedAnswer" />
          </template>

          <!-- TASK 8 -->
          <template v-else-if="taskType === 'task8'">
            <div
              class="flex flex-col items-start gap-[10px] ml-[55px] mr-[55px]"
            >
              <TaskText :prompt="taskData.prompt" />
              <TaskOptionsList :options="variant?.task8Options || []" />
            </div>
            <TaskAnswerStub />
            <TaskAnswerToggle :answer="formattedAnswer" />
          </template>

          <!-- DEFAULT: task1, task4, task5, task7, task9, task10, task11 -->
          <template v-else>
            <div class="flex items-start gap-[10px] ml-[55px] mr-[55px]">
              <TaskText :text="taskData.text" />
            </div>
            <TaskAnswerStub v-if="showAnswerStub" />
            <TaskAnswerToggle
              v-if="showAnswerButton"
              :answer="formattedAnswer"
            />
          </template>

          <TaskPayloadViewer :data="taskData" />
        </div>
      </template>
    </UCollapsible>
  </div>
</template>

<style lang="scss">
.task-container {
  --tw-ring-color: #cfcfcf;
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
  &.task__hided {
  }
}
</style>
