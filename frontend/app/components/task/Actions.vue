<script setup lang="ts">
defineProps<{
  forTask?: string;
}>();
const { pending: kbPending } = useKnowledgeBase();
const isLoading = computed(() => kbPending.value);
</script>

<template>
  <div class="task-action-btns shadow-hover">
    <VariantTaskPrevious :block-btns="isLoading" />
    <VariantTaskRefresh :block-btns="isLoading" :task="forTask" />
  </div>
</template>

<style scoped lang="scss">
.task-action-btns {
  position: absolute;
  left: -80px;
  display: flex;
  gap: 4px;
  transform: translateX(-100%);
  &.shadow-hover {
    button {
      box-shadow: 0 0 0 transparent;
      transition: box-shadow 0.3s ease;
    }
  }
}
</style>
