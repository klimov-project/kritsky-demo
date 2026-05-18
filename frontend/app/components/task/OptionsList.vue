<script setup lang="ts">
const props = defineProps<{
  options: Array<{ id: string; term: string }>;
}>();
</script>

<template>
  <div class="space-y-2 ml-12">
    <div
      v-for="(option, index) in options"
      :key="option.id"
      class="flex items-start gap-2"
    >
      <span class="font-semibold">{{ index + 1 }})</span>
      <span>{{ option.term }}</span>
    </div>
  </div>
</template>
