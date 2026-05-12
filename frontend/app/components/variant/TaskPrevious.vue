<script setup lang="ts"></script>

<template>
  <button
    type="button"
    class="icon-button flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    :style="{
      color: 'var(--ui-text)',
      backgroundColor: 'var(--ui-bg)',
    }"
    :aria-label="'Вернуть предыдущий вариант задания'"
    :title="'Назад'"
  >
    <!-- <button
      type="button"
      class="icon-button flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      :style="{
        color: 'var(--ui-text)',
        backgroundColor: disableBack ? 'transparent' : 'var(--ui-bg)',
      }"
      :aria-label="'Вернуть предыдущий вариант задания'"
      :title="'Назад'"
      :disabled="disableBack"
      @click="handleBack"
    > -->
    <svg
      stroke="currentColor"
      fill="none"
      stroke-width="1.5"
      viewBox="0 0 24 24"
      class="w-4 h-4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  </button>
</template>

<style scoped lang="scss"></style>
