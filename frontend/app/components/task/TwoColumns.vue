<script setup lang="ts">
const props = defineProps<{
  leftLabel: string;
  rightLabel: string;
  pairs: Array<{ id: string; character: string }>;
  options: string[];
}>();
</script>

<template>
  <div class="grid grid-cols-2 gap-8 mb-6">
    <!-- Левая колонка -->
    <div>
      <div
        class="text-center text-[28px] font-semibold mb-4"
        :style="{ color: 'var(--ui-text)' }"
      >
        {{ leftLabel }}
      </div>
      <div class="space-y-2">
        <div
          v-for="(pair, index) in pairs"
          :key="pair.id"
          class="flex items-start gap-2"
        >
          <span class="font-semibold"
            >{{ String.fromCharCode(65 + index) }})</span
          >
          <span>{{ pair.character }}</span>
        </div>
      </div>
    </div>

    <!-- Правая колонка -->
    <div>
      <div
        class="text-center text-[28px] font-semibold mb-4"
        :style="{ color: 'var(--ui-text)' }"
      >
        {{ rightLabel }}
      </div>
      <div class="space-y-2">
        <div
          v-for="(option, index) in options"
          :key="index"
          class="flex items-start gap-2"
        >
          <span class="font-semibold">{{ index + 1 }})</span>
          <span v-html="option"></span>
        </div>
      </div>
    </div>
  </div>
</template>
