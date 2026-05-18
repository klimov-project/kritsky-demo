<script setup lang="ts">
const props = defineProps<{
  number: string;
}>();
</script>

<template>
  <div
    class="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
    style="background-color: var(--ui-primary-bg);"
  >
    <TaskActions />
    <span class="text-base font-semibold leading-[20px] text-center">
      {{ number }}
    </span>
  </div>
</template>
