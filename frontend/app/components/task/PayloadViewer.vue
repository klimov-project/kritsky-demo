<script setup lang="ts">
const props = defineProps<{
  data: any;
}>();

const isVisible = ref(false);

const toggle = () => {
  isVisible.value = !isVisible.value;
};
</script>

<template>
  <div class="flex items-center justify-center no-print">
    <button
      type="button"
      class="icon-button flex-shrink-0 p-1 rounded-[5px] transition-all duration-200 hover:bg-[var(--ui-bg-muted)] active:scale-95"
      :style="{ color: 'var(--ui-text)' }"
      aria-label="Показать payload"
      title="Показать данные задания"
      @click="toggle"
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
          d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
        />
      </svg>
    </button>
    <div
      v-if="isVisible"
      class="absolute top-[30px] right-0 w-full z-10 mt-3 mb-5 p-4 bg-gray-100 rounded-lg overflow-auto max-h-96"
    >
      <pre class="text-xs">{{ JSON.stringify(data, null, 2) }}</pre>
    </div>
  </div>
</template>
