<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

const config = useRuntimeConfig();
const auth = useAuth();
const { session, isAuthenticated } = auth;

// // Fetch knowledge base
// const apiUrl = import.meta.server
//   ? `${config.apiBackendBase}/api/knowledge-base`
//   : '/api/knowledge-base';

// const {
//   data: kb,
//   pending: kbPending,
//   error: kbError,
//   refresh: refreshKb,
// } = await useFetch<any>(apiUrl, {
//   lazy: true,
//   server: true,
// });

// Fetch pregenerated variant
const {
  data: variantData,
  pending: isLoading,
  error: variantError,
  refresh: refreshVariant,
} = await useFetch<any>('/api/variants/runtime/pregenerated', {
  lazy: true,
  server: true,
});

// State
const selectedWorkId = ref('');
const selectedExcerptId = ref('');
const selectedPoetId = ref('');
const selectedPoemId = ref('');
const showAnswers = ref<Record<string, boolean>>({});
const isRefreshing = ref(false);

// Computed
const works = computed(() => kb.value?.works || []);
const poets = computed(() => kb.value?.poets || []);
const variant = computed(() => variantData.value?.variant || null);
const hasError = computed(() => kbError.value || variantError.value);

const selectedWork = computed(() => {
  return works.value.find((w: any) => w.id === selectedWorkId.value);
});

const selectedWorkExcerpts = computed(() => {
  return selectedWork.value?.excerpts || [];
});

// Task arrays
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

// Methods
const toggleAnswer = (taskKey: string) => {
  showAnswers.value[taskKey] = !showAnswers.value[taskKey];
};

const handleRefreshVariant = async () => {
  isRefreshing.value = true;
  try {
    await refreshVariant();
  } finally {
    isRefreshing.value = false;
  }
};

const formatAnswer = (answer: any) => {
  if (Array.isArray(answer)) {
    return answer.join(', ');
  }
  return answer || 'Нет ответа';
};

const getTaskNumber = (key: string) => {
  return key.replace('task', '');
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Page Header -->
    <div class="bg-white border-b">
      <div class="max-w-6xl mx-auto px-4 py-4">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Конструктор вариантов ЕГЭ
            </h1>
            <p class="text-sm text-gray-600 mt-1">
              Генерируйте уникальные варианты для подготовки к экзамену
            </p>
          </div>
          <div class="flex gap-3">
            <button
              @click="handleRefreshVariant"
              :disabled="isRefreshing || isLoading"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
            >
              <span v-if="isRefreshing" class="animate-spin">↻</span>
              {{ isRefreshing ? 'Генерация...' : 'Новый вариант' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex gap-6">
        <!-- Sidebar Filters -->
        <aside class="hidden lg:block w-64 flex-shrink-0">
          <div class="bg-white rounded-lg shadow p-4 sticky top-20">
            <h3 class="font-bold text-gray-900 mb-4">Фильтры</h3>

            <!-- Mode Selection -->
            <div class="space-y-2 mb-6">
              <button
                class="w-full text-left px-3 py-2 rounded bg-blue-50 text-blue-700 font-medium text-sm"
              >
                Весь вариант
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-sm"
              >
                Только отрывок
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-sm"
              >
                Только стихотворение
              </button>
            </div>

            <!-- Work Selection -->
            <div class="mb-4">
              <label
                class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2"
              >
                Произведение
              </label>
              <select
                v-model="selectedWorkId"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Все произведения</option>
                <option v-for="work in works" :key="work.id" :value="work.id">
                  {{ work.author }} — {{ work.title }}
                </option>
              </select>
            </div>

            <!-- Excerpt Selection -->
            <div v-if="selectedWorkExcerpts.length" class="mb-4">
              <label
                class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2"
              >
                Отрывок
              </label>
              <select
                v-model="selectedExcerptId"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Все отрывки</option>
                <option
                  v-for="(excerpt, i) in selectedWorkExcerpts"
                  :key="excerpt.id"
                  :value="excerpt.id"
                >
                  Отрывок {{ i + 1 }}
                </option>
              </select>
            </div>

            <!-- Actions -->
            <div class="pt-4 border-t">
              <a
                href="mailto:support@kritsky.academy"
                class="text-sm text-blue-600 hover:text-blue-700"
              >
                Обратная связь
              </a>
            </div>
          </div>
        </aside>

        <!-- Main Variant Content -->
        <div class="flex-1 min-w-0">
          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-20">
            <div
              class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            ></div>
            <p class="mt-4 text-gray-600">Подготовка варианта...</p>
          </div>

          <!-- Error State -->
          <div
            v-else-if="hasError"
            class="bg-red-50 border border-red-200 rounded-lg p-6"
          >
            <p class="text-red-700">
              Ошибка загрузки данных. Пожалуйста, попробуйте позже.
            </p>
            <button
              @click="
                refreshKb();
                refreshVariant();
              "
              class="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Повторить загрузку
            </button>
          </div>

          <!-- Variant Content -->
          <div v-else-if="variant" class="space-y-8">
            <!-- Variant Header Card -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-900">Вариант 1</h2>
                <span class="text-sm text-gray-500">Часть 1</span>
              </div>
              <p class="text-gray-600 text-sm">
                Прочитайте приведённый ниже фрагмент текста и выполните задания
                1–5 и 6.
              </p>
            </div>

            <!-- Part 1: Tasks 1-11 -->
            <section>
              <h2
                class="text-lg font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-6"
              >
                Часть 1. Задания с кратким ответом
              </h2>

              <div class="space-y-6">
                <div
                  v-for="key in shortTasks"
                  :key="key"
                  class="bg-white rounded-lg shadow p-6"
                >
                  <!-- Task Number Badge -->
                  <div class="flex items-start gap-4">
                    <span
                      class="bg-gray-800 text-white px-3 py-1 text-sm font-bold rounded flex-shrink-0"
                    >
                      {{ getTaskNumber(key) }}
                    </span>

                    <div class="flex-1 min-w-0">
                      <!-- Excerpt Block (for tasks with excerpts) -->
                      <div
                        v-if="variant[key]?.excerpt"
                        class="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-400"
                      >
                        <p
                          class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed"
                        >
                          {{ variant[key].excerpt.text }}
                        </p>
                        <p
                          class="text-right text-sm font-semibold text-gray-600 mt-3"
                        >
                          — {{ variant[key].excerpt.author }}, «{{
                            variant[key].excerpt.work
                          }}»
                        </p>
                      </div>

                      <!-- Poem Block (for tasks with poems) -->
                      <div
                        v-if="variant[key]?.poem"
                        class="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-400"
                      >
                        <p
                          class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed italic"
                        >
                          {{ variant[key].poem.text }}
                        </p>
                        <p
                          class="text-right text-sm font-semibold text-gray-600 mt-3"
                        >
                          — {{ variant[key].poem.author }}, «{{
                            variant[key].poem.title
                          }}»
                        </p>
                      </div>

                      <!-- Task Text -->
                      <div
                        class="prose prose-sm max-w-none"
                        v-html="variant[key]?.text"
                      ></div>

                      <!-- Task Prompt (if present) -->
                      <div
                        v-if="variant[key]?.prompt"
                        class="mt-3 text-sm text-gray-600 italic"
                        v-html="variant[key].prompt"
                      ></div>

                      <!-- Answer Toggle -->
                      <div class="mt-4 pt-4 border-t">
                        <button
                          @click="toggleAnswer(key)"
                          class="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {{
                            showAnswers[key] ? 'Скрыть ответ' : 'Показать ответ'
                          }}
                        </button>
                        <div
                          v-if="showAnswers[key]"
                          class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <span class="text-sm font-medium text-green-800"
                            >Ответ:</span
                          >
                          <span class="text-sm text-green-700 ml-2">{{
                            formatAnswer(variant[key]?.answer)
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Part 2: Tasks 12-16 -->
            <section>
              <h2
                class="text-lg font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-6"
              >
                Часть 2. Задания с развёрнутым ответом
              </h2>

              <div class="space-y-6">
                <div
                  v-for="key in longTasks"
                  :key="key"
                  class="bg-white rounded-lg shadow p-6"
                >
                  <div class="flex items-start gap-4">
                    <span
                      class="bg-gray-800 text-white px-3 py-1 text-sm font-bold rounded flex-shrink-0"
                    >
                      {{ getTaskNumber(key) }}
                    </span>

                    <div class="flex-1">
                      <div
                        class="prose prose-sm max-w-none font-medium"
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

          <!-- Empty State -->
          <div v-else class="bg-white rounded-lg shadow p-6 text-center">
            <p class="text-gray-600">
              Нет данных для отображения. Нажмите "Новый вариант" для генерации.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.prose p {
  margin-bottom: 0.5rem;
}
</style>
