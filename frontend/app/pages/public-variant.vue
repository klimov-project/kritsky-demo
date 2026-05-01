<script setup lang="ts">
const { data: payload, pending, error, refresh } = await useFetch(
  '/api/variants/runtime/pregenerated',
  {
    server: true,
  },
);

const variant = computed(() => payload.value?.variant || {});

// Helper to check if a task is an essay
const isEssay = (task: any) => task?.type === 'essay';

// Helper to get keys for tasks 1-11 and 12-16
const shortTasks = [
  'task1',
  'task2',
  'task3',
  'task4',
  'task5',
  'task6',
  'task7',
  'task8',
  'task9',
  'task10',
  'task11',
];
const longTasks = ['task12', 'task13', 'task14', 'task15', 'task16'];

const getTaskLabel = (key: string) => {
  return key.replace('task', 'Задание ');
};
</script>

<template>
  <div class="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
    <div class="flex justify-between items-center mb-8">
      <NuxtLink to="/" class="text-blue-600 hover:underline"
        >&larr; На главную</NuxtLink
      >
      <h1 class="text-2xl font-bold">Демонстрационный вариант ЕГЭ</h1>
      <button
        @click="refresh()"
        class="bg-white border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-100"
        :disabled="pending"
      >
        {{ pending ? 'Загрузка...' : 'Обновить' }}
      </button>
    </div>

    <div
      v-if="error"
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
    >
      Ошибка загрузки варианта. Пожалуйста, попробуйте позже.
    </div>

    <div v-else-if="pending && !payload" class="text-center py-20">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
      ></div>
      <p class="mt-4 text-gray-600">Подготовка варианта...</p>
    </div>

    <div v-else-if="variant" class="space-y-10">
      <!-- Part 1 -->
      <section>
        <h2 class="text-xl font-bold border-b-2 border-gray-800 pb-2 mb-6">
          Часть 1
        </h2>

        <div class="space-y-8">
          <div
            v-for="key in shortTasks"
            :key="key"
            class="bg-white p-6 rounded shadow-sm"
          >
            <div class="flex items-start gap-4">
              <span
                class="bg-gray-800 text-white px-2 py-1 text-xs font-bold rounded"
              >
                {{ key.replace('task', '') }}
              </span>
              <div class="flex-1">
                <!-- Excerpt for Task 4 -->
                <div
                  v-if="variant[key]?.excerpt"
                  class="mb-4 p-4 bg-gray-100 italic rounded text-sm border-l-4 border-gray-300"
                >
                  <p class="mb-2 whitespace-pre-wrap">
                    {{ variant[key].excerpt.text }}
                  </p>
                  <p class="text-right font-bold">
                    — {{ variant[key].excerpt.author }}, "{{
                      variant[key].excerpt.work
                    }}"
                  </p>
                </div>

                <!-- Poem for Task 10 -->
                <div
                  v-if="variant[key]?.poem"
                  class="mb-4 p-4 bg-gray-100 italic rounded text-sm border-l-4 border-gray-300"
                >
                  <p class="mb-2 whitespace-pre-wrap">
                    {{ variant[key].poem.text }}
                  </p>
                  <p class="text-right font-bold">
                    — {{ variant[key].poem.author }}, "{{
                      variant[key].poem.title
                    }}"
                  </p>
                </div>

                <div class="prose max-w-none" v-html="variant[key]?.text"></div>

                <div
                  v-if="variant[key]?.prompt"
                  class="mt-2 text-sm text-gray-600 italic"
                  v-html="variant[key].prompt"
                ></div>

                <details class="mt-4 text-sm">
                  <summary class="cursor-pointer text-blue-600 hover:underline"
                    >Показать ответ</summary
                  >
                  <div
                    class="mt-2 p-2 bg-green-50 rounded border border-green-200"
                  >
                    <strong>Ответ:</strong>
                    {{
                      Array.isArray(variant[key]?.answer)
                        ? variant[key].answer.join(', ')
                        : variant[key]?.answer
                    }}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Part 2 -->
      <section>
        <h2 class="text-xl font-bold border-b-2 border-gray-800 pb-2 mb-6">
          Часть 2
        </h2>

        <div class="space-y-8">
          <div
            v-for="key in longTasks"
            :key="key"
            class="bg-white p-6 rounded shadow-sm"
          >
            <div class="flex items-start gap-4">
              <span
                class="bg-gray-800 text-white px-2 py-1 text-xs font-bold rounded"
              >
                {{ key.replace('task', '') }}
              </span>
              <div class="flex-1">
                <div
                  class="prose max-w-none font-medium"
                  v-html="variant[key]?.text"
                ></div>
                <p class="mt-4 text-sm text-gray-500 italic">
                  Требуется написание сочинения.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
.prose p {
  margin-bottom: 0.5rem;
}
</style>
