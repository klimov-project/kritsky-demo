<script setup lang="ts"></script>
<template>
  <div class="task-instruction-wrapper text-default">
    <p class="task-instruction leading-[23px]">
      <slot />
    </p>
  </div>
</template>
<style lang="scss">
.task-instruction {
  text-align: left;
  font-size: 20px;
  white-space: normal;
  font-kerning: auto;
  font-feature-settings: normal;
  font-optical-sizing: auto;

  &-wrapper {
    box-sizing: border-box;
    background: #f6f6f6;
    border: 1px solid #333333;
    border-radius: 5px;
    padding: 14px 40px;
    margin-bottom: 20px;
  }
}
</style>
