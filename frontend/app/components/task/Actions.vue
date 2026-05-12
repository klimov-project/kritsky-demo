<script setup lang="ts"></script>

<template>
  <div class="task-action-btns">
    <VariantTaskPrevious />
    <VariantTaskRefresh />
  </div>
</template>

<style scoped lang="scss">
.task-action-btns {
  position: absolute;
  left: -80px;
  display: flex;
  gap: 4px;
  transform: translateX(-100%);
}
</style>
