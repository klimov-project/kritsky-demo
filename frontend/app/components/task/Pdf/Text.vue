<script setup lang="ts">
const props = defineProps<{
  text?: string;
  prompt?: string;
  part1?: string;
  part2?: string;
}>();

const contentHtml = computed(() => {
  if (props.part1 && props.part2) {
    return `
      <p>${props.part1}</p>
      <p>${props.part2}</p>
    `;
  }

  return props.text || props.prompt || '';
});
</script>

<template>
  <p v-html="contentHtml" class="task-pdf-text pl-14"></p>
</template>
