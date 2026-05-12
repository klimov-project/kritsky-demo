<script setup lang="ts">
const props = defineProps<{
  taskNumber: string;
  taskText?: string;
  answer?: any;
  isTermQuestion?: boolean;
}>();

// Реактивные состояния для управления чекбоксами и видимостью
const showLiteraryQuestions = ref(true);
const showTermQuestions = ref(true);
const isAnswerVisible = ref(false);

const toggleVisibility = () => {
  // Здесь будет логика скрытия/показа задания
  // isVisible?: boolean;
  console.log('Toggle visibility');
};

const toggleAnswer = () => {
  // Здесь будет логика скрытия/показа задания
  // isVisible?: boolean;
  console.log('Toggle visibility');

  isAnswerVisible.value = !isAnswerVisible.value;
};

const formattedAnswer = computed(() => {
  if (Array.isArray(props.answer)) {
    return props.answer.join(', ');
  }
  return props.answer || 'Нет ответа';
});
</script>

<template>
  <div
    class="container-task rounded-[10px] border p-5 relative transition-all duration-300"
    :style="{
      borderColor: 'var(--ui-border)',
      backgroundColor: 'var(--ui-bg)',
    }"
  >
    <TaskActions />
    <!-- Верхняя панель с действиями -->
    <div class="no-print flex items-start justify-between gap-4 mb-4">
      <!-- Группа чекбоксов-переключателей -->
      <div class="flex flex-row items-center gap-[10px]">
        <!-- Чекбокс "Вопросы о произведении" -->
        <label
          class="flex flex-row items-center gap-[10px] cursor-pointer select-none group"
          :class="{ 'opacity-60': !showLiteraryQuestions }"
        >
          <div class="relative w-6 h-6 flex-shrink-0">
            <!-- Скрытый нативный чекбокс -->
            <input
              type="checkbox"
              v-model="showLiteraryQuestions"
              class="sr-only peer"
            />
            <!-- Кастомный стилизованный квадрат -->
            <div
              class="absolute inset-0 w-full h-full flex items-center justify-center rounded-[5px] border border-[var(--ui-border)] bg-[var(--ui-bg)] transition-all duration-200 peer-checked:bg-[var(--ui-primary-bg)] peer-checked:border-[var(--ui-primary-bg)] group-hover:border-[var(--ui-border-accented)]"
            >
              <!-- Круглый индикатор внутри (как на макете Figma) -->
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
            class="text-base font-normal leading-[19px] font-['Minion_Cyrillic',_sans-serif]"
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
            class="text-base font-normal leading-[19px] font-['Minion_Cyrillic',_sans-serif]"
            :style="{ color: 'var(--ui-text)' }"
          >
            Вопросы о терминах
          </span>
        </label>
      </div>

      <!-- Кнопка скрытия/показа (eye) в правом верхнем углу -->
      <button
        type="button"
        class="icon-button flex-shrink-0 p-1 rounded-[5px] transition-all duration-200 hover:bg-[var(--ui-bg-elevated)] active:scale-95"
        :style="{ color: 'var(--ui-text)' }"
        aria-label="Скрыть задание"
        title="Скрыть"
        @click="toggleVisibility"
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
    </div>

    <!-- Блок с заданием -->
    <div class="flex-1 space-y-3">
      <!-- Номер вопроса и текст -->
      <div class="flex items-start gap-[10px]">
        <!-- Номер вопроса -->
        <div
          class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px]"
          style="background-color: var(--ui-primary-bg);"
        >
          <span
            class="font-['Gilroy',_sans-serif] text-base font-semibold leading-[20px] text-center"
            :style="{ color: 'var(--ui-text)' }"
          >
            {{ taskNumber }}
          </span>
        </div>

        <!-- Текст вопроса -->
        <div
          class="flex-1 pt-[8px] font-['Minion_Cyrillic',_sans-serif] text-xl font-normal leading-[23px]"
          :style="{ color: 'var(--ui-text)' }"
          v-html="taskText"
        ></div>
      </div>

      <!-- Строка ответа -->
      <div
        class="flex items-center gap-[10px] text-base font-normal leading-[19px] uppercase"
        :style="{ color: 'var(--ui-text)' }"
      >
        <!-- Подпись "Ответ:" -->
        <span class="font-['Gilroy',_sans-serif] font-semibold flex-shrink-0">
          Ответ:
        </span>
        <!-- Длинное подчёркивание (имитация строки ввода) -->
        <div
          class="flex-1 border-b-2 h-[19px]"
          style="border-color: var(--ui-border);"
        ></div>
      </div>

      <!-- Кнопка "Показать ответ" -->
      <div class="flex justify-start mt-2">
        <BaseButton @click="toggleAnswer">
          {{ isAnswerVisible ? 'Скрыть ответ' : 'Показать ответ' }}
        </BaseButton>
      </div>
      <div
        v-if="isAnswerVisible"
        class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
      >
        <span class="text-sm font-medium text-green-800">Ответ:</span>
        <span class="text-sm text-green-700 ml-2">
          {{ formattedAnswer }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container-task {
  &:deep(.rounded-md) {
    border-radius: 5px;
  }
  &:deep(.base-btn) {
    padding: 8px 15px;
    height: 30px;
  }
}
</style>
