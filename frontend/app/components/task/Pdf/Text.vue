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
      <div class="mb-4">${props.part1}</div>
      <div>${props.part2}</div>
    `;
  }

  return props.text || props.prompt || '';
});
</script>

<template>
  <p v-html="contentHtml"></p>
</template>
