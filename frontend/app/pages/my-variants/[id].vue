<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

const route = useRoute();
const variantId = computed(() => route.params.id);

// Mock variant data
const variant = ref({
  id: variantId.value,
  title: 'Вариант от 01.01.2025',
  createdAt: '2025-01-01',
  saved: true,
  tasks: {
    task1: {
      text: 'Укажите род литературы, к которому принадлежит произведение.',
      answer: 'эпос',
    },
    task2: {
      text: 'Установите соответствия между персонажами и их репликами.',
      answer: '1-Б, 2-А',
    },
    task3: {
      text: 'Как называется художественное средство?',
      answer: 'метафора',
    },
    task4: {
      text: 'Из какого произведения взят фрагмент?',
      answer: 'Евгений Онегин',
      excerpt: {
        text: 'Мой дядя самых честных правил...',
        author: 'А.С. Пушкин',
        work: 'Евгений Онегин',
      },
    },
    task5: { text: 'Определите размер стихотворения.', answer: 'ямб' },
  },
});

const isLoading = ref(false);
const showAnswers = ref<Record<string, boolean>>({});

const toggleAnswer = (taskKey: string) => {
  showAnswers.value[taskKey] = !showAnswers.value[taskKey];
};

const shortTasks = ['task1', 'task2', 'task3', 'task4', 'task5'];
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/my-variants"
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← К моим вариантам
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ variant.title }}
            </h1>
          </div>
          <div class="flex gap-2">
            <button
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Скачать PDF
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-20">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
        <p class="mt-4 text-gray-600">Загрузка...</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Variant Info -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">
                Создан:
                {{ new Date(variant.createdAt).toLocaleDateString('ru-RU') }}
              </p>
            </div>
            <span
              v-if="variant.saved"
              class="text-yellow-500 text-xl"
              title="Сохранён"
              >⭐</span
            >
          </div>
        </div>

        <!-- Tasks -->
        <div class="space-y-4">
          <div
            v-for="key in shortTasks"
            :key="key"
            class="bg-white rounded-lg shadow p-6"
          >
            <div class="flex items-start gap-4">
              <span
                class="bg-gray-800 text-white px-3 py-1 text-sm font-bold rounded flex-shrink-0"
              >
                {{ key.replace('task', '') }}
              </span>

              <div class="flex-1">
                <!-- Excerpt Block -->
                <div
                  v-if="variant.tasks[key]?.excerpt"
                  class="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-400"
                >
                  <p class="text-sm text-gray-700 whitespace-pre-wrap">
                    {{ variant.tasks[key].excerpt.text }}
                  </p>
                  <p
                    class="text-right text-sm font-semibold text-gray-600 mt-3"
                  >
                    — {{ variant.tasks[key].excerpt.author }}, «{{
                      variant.tasks[key].excerpt.work
                    }}»
                  </p>
                </div>

                <!-- Task Text -->
                <p class="text-gray-900">{{ variant.tasks[key]?.text }}</p>

                <!-- Answer Toggle -->
                <div class="mt-4 pt-4 border-t">
                  <button
                    @click="toggleAnswer(key)"
                    class="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {{ showAnswers[key] ? 'Скрыть ответ' : 'Показать ответ' }}
                  </button>
                  <div
                    v-if="showAnswers[key]"
                    class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <span class="text-sm font-medium text-green-800"
                      >Ответ:</span
                    >
                    <span class="text-sm text-green-700 ml-2">{{
                      variant.tasks[key]?.answer
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
