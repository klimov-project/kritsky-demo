<script setup lang="ts">
const emit = defineEmits<{
  toggle: [];
}>();

const handleClick = () => {
  emit('toggle');
};
</script>

<template>
  <button
    type="button"
    class="icon-button flex-shrink-0 p-1 rounded-[5px] transition-all duration-200 hover:bg-[var(--ui-bg-elevated)] active:scale-95"
    :style="{ color: 'var(--ui-text)' }"
    aria-label="Скрыть задание"
    title="Скрыть"
    @click="handleClick"
  >
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
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  </button>
</template>
