<script setup lang="ts">
const showLiteraryQuestions = ref(true);
const showTermQuestions = ref(true);
</script>

<template>
  <div class="flex flex-row items-center gap-[10px]">
    <!-- Чекбокс "Вопросы о произведении" -->
    <label
      class="flex flex-row items-center gap-[10px] cursor-pointer select-none group"
      :class="{ 'opacity-60': !showLiteraryQuestions }"
    >
      <div class="relative w-6 h-6 flex-shrink-0">
        <input
          type="checkbox"
          v-model="showLiteraryQuestions"
          class="sr-only peer"
        />
        <div
          class="absolute inset-0 w-full h-full flex items-center justify-center rounded-[5px] border border-[var(--ui-border)] bg-[var(--ui-bg)] transition-all duration-200 peer-checked:bg-[var(--ui-primary-bg)] peer-checked:border-[var(--ui-primary-bg)] group-hover:border-[var(--ui-border-accented)]"
        >
          <div
            class="w-[10px] h-[10px] rounded-full transition-all duration-200"
            :class="
              showLiteraryQuestions
                ? 'bg-[var(--ui-text)] scale-100'
                : 'bg-transparent scale-0'
            "
          ></div>
        </div>
      </div>
      <span
        class="text-base leading-[19px]"
        :style="{ color: 'var(--ui-text)' }"
      >
        Вопросы о произведении
      </span>
    </label>

    <!-- Чекбокс "Вопросы о терминах" -->
    <label
      class="flex flex-row items-center gap-[10px] cursor-pointer select-none group"
      :class="{ 'opacity-60': !showTermQuestions }"
    >
      <div class="relative w-6 h-6 flex-shrink-0">
        <input
          type="checkbox"
          v-model="showTermQuestions"
          class="sr-only peer"
        />
        <div
          class="absolute inset-0 w-full h-full flex items-center justify-center rounded-[5px] border border-[var(--ui-border)] bg-[var(--ui-bg)] transition-all duration-200 peer-checked:bg-[var(--ui-primary-bg)] peer-checked:border-[var(--ui-primary-bg)] group-hover:border-[var(--ui-border-accented)]"
        >
          <div
            class="w-[10px] h-[10px] rounded-full transition-all duration-200"
            :class="
              showTermQuestions
                ? 'bg-[var(--ui-text)] scale-100'
                : 'bg-transparent scale-0'
            "
          ></div>
        </div>
      </div>
      <span
        class="text-base leading-[19px]"
        :style="{ color: 'var(--ui-text)' }"
      >
        Вопросы о терминах
      </span>
    </label>
  </div>
</template>
