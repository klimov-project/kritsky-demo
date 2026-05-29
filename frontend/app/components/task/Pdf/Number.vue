<script setup lang="ts">
const props = defineProps<{
  number: string;
}>();
</script>

<template>
  <div class="task-number-pdf absolute top-7 left-10">
    <span class="task-number-pdf__number">{{ number }}</span>
    <div class="task-number-pdf__bg"></div>
  </div>
</template>
<style lang="scss">
.task-number-pdf {
  &__bg {
    background-color: #f6f6f6;
    position: relative;
    position: absolute;
    top: 23px;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    border-radius: 10px;
    z-index: 0;
  }
  &__number {
    position: relative;
    z-index: 10;
  }
}
</style>
