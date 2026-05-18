<script setup lang="ts">
const props = defineProps<{
  text?: string;
  prompt?: string;
  part1?: string;
  part2?: string;
}>();
</script>

<template>
  <div class="text-base flex-1 pt-[8px] text-xl leading-[23px]">
    <template v-if="part1 && part2">
      <div v-html="part1" class="mb-4"></div>
      <div v-html="part2"></div>
    </template>
    <template v-else>
      <div v-html="text || prompt"></div>
    </template>
  </div>
</template>
