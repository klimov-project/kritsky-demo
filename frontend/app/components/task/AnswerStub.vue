<script setup lang="ts"></script>

<template>
  <div
    class="flex items-center gap-[10px] text-base leading-[19px] uppercase"
    :style="{ color: 'var(--ui-text)' }"
  >
    <span class="text-base font-medium uppercase tracking-wider">
      Ответ:
    </span>
    <div class="answer-stub__line flex-1 border-b-2 h-[19px]"></div>
  </div>
</template>
<style lang="scss">
.answer-stub__line {
  border-color: #e2e8f0;
}
</style>
