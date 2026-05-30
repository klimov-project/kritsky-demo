<script setup lang="ts">
const props = defineProps<{ taskKey: string }>();
const variant = useCurrentVariant();

const getTaskNumber = (key: string) => {
  return key.replace('task', '').replace(/_/g, '.');
};

const taskData = computed(() => variant.value?.[props.taskKey] || {});

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
</script>

<template>
  <div class="task-container bg-white rounded-[10px] mb-3 p-6">
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0">
        <TaskNumber :number="getTaskNumber(props.taskKey)" />
      </div>
      <div class="flex-1">
        <template v-if="taskType === 'task2'">
          <TaskText :prompt="taskData.prompt" />
          <TaskTwoColumns
            :left-label="taskData.leftLabel"
            :right-label="taskData.rightLabel"
            :pairs="taskData.pairs || []"
            :options="taskData.options || []"
          />
        </template>

        <template v-else-if="taskType === 'task3' || taskType === 'task6'">
          <TaskText :part1="taskData.part1" :part2="taskData.part2" />
        </template>

        <template v-else-if="taskType === 'task8'">
          <TaskText :prompt="taskData.prompt" />
          <TaskOptionsList :options="variant?.task8Options || []" />
        </template>

        <template v-else>
          <TaskText :text="taskData.text" />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-container {
  padding: 16px;
}
</style>
