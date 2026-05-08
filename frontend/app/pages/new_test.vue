<script setup lang="ts">
import { useKnowledgeBase } from '~/composables/useKnowledgeBase';
const config = useRuntimeConfig();
const auth = useAuth();
const { session, isAuthenticated } = auth;

const apiUrl = import.meta.server ? config.apiBackendUrl : config.public.apiUrl;

// Fetch knowledge base
const { kbStore, loadKnowledgeBase } = useKnowledgeBase();
loadKnowledgeBase();
const { isLoading: kbPending, error: kbError } = storeToRefs(kbStore);
// Fetch pregenerated variant
const variantUrl = `${apiUrl}/variants/runtime/pregenerated`;
const {
  data: variantData,
  pending: variantPending,
  error: variantError,
  refresh: refreshVariant,
} = await useFetch<any>(variantUrl, {
  server: true,
  lazy: true,
});

// State - From React implementation (page.tsx) for feature parity
const selectedWorkId = ref('');
const selectedExcerptId = ref('');
const selectedChapter = ref('');
const showAnswers = ref<Record<string, boolean>>({});
const isRefreshing = ref(false);
const animationKey = ref(0);

// Computed properties - From 01_ege_format_requirements.md: exam structure
const works = computed(() => kbStore.works || []);
const poets = computed(() => kbStore.poets || []);
const knowledgeBaseSettings = computed(() => kbStore.settings || {});
const variant = computed(() => variantData.value?.variant || null);
const isLoading = computed(() => kbPending.value || variantPending.value);
const hasError = computed(() => kbError.value || variantError.value);

const selectedWork = computed(() => {
  return works.value.find((w: any) => w.id === selectedWorkId.value);
});

const selectedExcerpt = computed(() => {
  if (!selectedWork.value) return null;
  return selectedWork.value.excerpts?.find(
    (e: any) => e.id === selectedExcerptId.value,
  );
});

// Extract unique chapters from selected work excerpts
// From 03_current_implementation.md: variant data structure includes excerpts with chapters
const excerptChapters = computed(() => {
  if (!selectedWork.value) return [];
  const chapters = new Set<string>();
  selectedWork.value.excerpts?.forEach((excerpt: any) => {
    if (excerpt.chapter) chapters.add(excerpt.chapter);
  });
  return Array.from(chapters);
});

// Dropdown options for excerpts
const excerptDropdownOptions = computed(() => {
  if (!selectedWork.value) return [];
  return (
    selectedWork.value.excerpts?.map((excerpt: any, i: number) => ({
      value: excerpt.id,
      label: `Отрывок ${i + 1}${
        excerpt.chapter ? ` (${excerpt.chapter})` : ''
      }`,
    })) || []
  );
});

// Task arrays - From 01_ege_format_requirements.md: exam structure (tasks 1-5, 10-11 short answer; 12-16 essays)
const shortTasks = ['task1', 'task2', 'task3', 'task4', 'task5'];
const poemTasks = ['task10', 'task11'];
const longTasks = ['task12', 'task13', 'task14', 'task15', 'task16'];

// Methods
const toggleAnswer = (taskKey: string) => {
  showAnswers.value[taskKey] = !showAnswers.value[taskKey];
};

const handleRefreshVariant = async () => {
  isRefreshing.value = true;
  try {
    await refreshVariant();
    // Trigger animation on variant change
    animationKey.value += 1;
  } finally {
    isRefreshing.value = false;
  }
};

const refreshBlock1 = async () => {
  // From React: refreshBlock1 refreshes excerpt and tasks 1-5
  await handleRefreshVariant();
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

const isAdmin = computed(() => (session.value?.user as any)?.role === 'admin');
const isPro = computed(
  () => (session.value?.user as any)?.subscriptionStatus === 'active',
);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Page Header - From React: NewTestGlobalStyles applied -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Конструктор вариантов ЕГЭ
            </h1>
            <p class="text-sm text-gray-600 mt-1">
              Генерируйте уникальные варианты для подготовки к экзамену
            </p>
          </div>
          <div class="flex gap-2">
            <button
              @click="handleRefreshVariant"
              :disabled="isRefreshing || isLoading"
              class="bg-[#bd5343] hover:bg-[#ab4a3c] disabled:bg-gray-400 text-white px-6 py-2 rounded-full font-medium transition inline-flex items-center gap-2 uppercase text-sm"
              :aria-busy="isRefreshing"
            >
              <svg
                v-if="isRefreshing"
                class="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isRefreshing ? 'Генерация...' : 'Новый вариант' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex gap-6">
        <!-- Sidebar - From React: no-print class for hiding in print mode -->
        <aside class="hidden lg:block w-64 flex-shrink-0 no-print">
          <div class="bg-white rounded-lg shadow p-6 sticky top-24">
            <!-- Mode Selection - From React: sideModeCard -->
            <nav class="space-y-2 mb-6 pb-6 border-b">
              <button
                class="w-full text-left px-3 py-2 rounded bg-[#bd5343] text-white font-medium text-sm transition"
              >
                Весь вариант
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-sm transition"
              >
                Только отрывок
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-sm transition"
              >
                Только стихотворение
              </button>
            </nav>

            <!-- Filters - From React: TopGrid section -->
            <div class="space-y-4">
              <!-- Work Selection -->
              <div>
                <label
                  class="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2"
                >
                  Произведение
                </label>
                <select
                  v-model="selectedWorkId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#bd5343] focus:border-transparent"
                >
                  <option value="">Все произведения</option>
                  <option v-for="work in works" :key="work.id" :value="work.id">
                    {{ work.author }} — {{ work.title }}
                  </option>
                </select>
              </div>

              <!-- Chapter Selection -->
              <div v-if="selectedWork">
                <label
                  class="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2"
                >
                  Глава
                </label>
                <select
                  v-model="selectedChapter"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#bd5343] focus:border-transparent"
                >
                  <option value="">Все главы</option>
                  <option
                    v-for="(chapter, i) in excerptChapters"
                    :key="chapter"
                    :value="chapter"
                  >
                    {{ i + 1 }}. {{ chapter }}
                  </option>
                </select>
              </div>

              <!-- Excerpt Selection - From React: locked for non-Pro users -->
              <div>
                <label
                  class="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2"
                >
                  Отрывок
                </label>
                <div class="relative">
                  <select
                    v-model="selectedExcerptId"
                    :disabled="!isPro"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#bd5343] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    <option value="">Выберите отрывок</option>
                    <option
                      v-for="excerpt in excerptDropdownOptions"
                      :key="excerpt.value"
                      :value="excerpt.value"
                    >
                      {{ excerpt.label }}
                    </option>
                  </select>
                  <svg
                    v-if="!isPro"
                    class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12 1L9.912 4.078A6.002 6.002 0 006 9.5v4c0 .563-.369 1.041-.883 1.449L4 17v2h16v-2l-1.117-.051A1.5 1.5 0 0018 13.5v-4c0-2.22-1.343-4.127-3.255-4.956L12 1zm0 2l1.5 2.5A4.002 4.002 0 0016 9.5v4c0 1.373.856 2.545 2.062 3H5.938C7.144 16.045 8 14.873 8 13.5v-4c0-1.626.888-3.04 2.2-3.81L12 3z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-6 pt-6 border-t space-y-3">
              <button
                @click="refreshBlock1"
                :disabled="isLoading"
                class="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition text-sm inline-flex items-center justify-center gap-2"
              >
                <svg
                  v-if="isRefreshing"
                  class="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Обновить отрывок и задания 1–5
              </button>

              <a
                href="mailto:support@kritsky.academy"
                class="block text-center text-sm text-[#bd5343] hover:text-[#ab4a3c] font-medium"
              >
                ✉ Обратная связь
              </a>
            </div>
          </div>
        </aside>

        <!-- Main Variant Content -->
        <div class="flex-1 min-w-0">
          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="flex flex-col items-center justify-center py-20"
          >
            <svg
              class="animate-spin h-12 w-12 text-[#bd5343]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p class="mt-4 text-gray-600 font-medium">Подготовка варианта...</p>
          </div>

          <!-- Error State -->
          <div
            v-else-if="hasError"
            class="bg-red-50 border border-red-200 rounded-lg p-6"
          >
            <p class="text-red-700 font-medium mb-4">
              Ошибка загрузки данных. Пожалуйста, попробуйте позже.
            </p>
            <button
              @click="
                () => {
                  refreshVariant();
                }
              "
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Повторить загрузку
            </button>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="!variant"
            class="bg-white rounded-lg shadow p-6 text-center"
          >
            <p class="text-gray-600">
              Нет данных для отображения. Нажмите "Новый вариант" для генерации.
            </p>
          </div>

          <!-- Variant Content - From React implementation -->
          <div v-else class="space-y-8 scene-animate" :key="animationKey">
            <!-- Variant Header -->
            <div class="bg-white rounded-lg shadow p-6">
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4"
              >
                <div class="flex flex-wrap gap-2">
                  <div
                    class="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold"
                  >
                    Вариант 1
                  </div>
                  <div class="bg-gray-600 text-white px-4 py-2 rounded-lg">
                    Часть 1
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    class="px-3 py-1 bg-[#bd5343] text-white rounded text-sm font-medium"
                  >
                    Весь вариант
                  </button>
                  <button
                    class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
                  >
                    Только отрывок
                  </button>
                  <button
                    class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
                  >
                    Только стих.
                  </button>
                </div>
              </div>
              <p class="text-gray-600 text-sm">
                Прочитайте приведённый ниже фрагмент текста и выполните задания
                1–5 и 6.
              </p>
            </div>

            <!-- Admin Info - From React: admin metadata -->
            <div
              v-if="isAdmin && variant.work"
              class="no-print mt-2 mb-4 text-xs text-gray-500"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span
                  >Произведение: {{ variant.work.author }} —
                  {{ variant.work.title }}</span
                >
                <span class="bg-gray-100 px-2 py-1 rounded font-mono">{{
                  variant.work.id
                }}</span>
                <span>| Отрывок:</span>
                <span class="bg-gray-100 px-2 py-1 rounded font-mono">{{
                  variant.excerpt?.id
                }}</span>
              </div>
            </div>

            <!-- Excerpt Text Card -->
            <div class="bg-white rounded-lg shadow p-6 space-y-4">
              <div class="prose prose-sm max-w-none text-sm leading-relaxed">
                <div
                  v-html="
                    variant.excerpt?.text ||
                    'Текст отрывка будет отображаться здесь.'
                  "
                ></div>
              </div>
              <div class="flex justify-end">
                <div class="text-right">
                  <p class="text-sm font-bold">
                    {{ variant.work?.author }} — {{ variant.work?.title }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Part 1: Tasks 1–5 -->
            <section>
              <h2
                class="text-xl font-bold text-gray-900 border-b-2 border-gray-900 pb-3 mb-6"
              >
                Задания 1–5
              </h2>

              <div class="space-y-6">
                <div
                  v-for="key in shortTasks"
                  :key="key"
                  class="bg-white rounded-lg shadow p-6"
                >
                  <div class="flex gap-4">
                    <span
                      class="bg-gray-900 text-white px-3 py-1 text-sm font-bold rounded flex-shrink-0 h-fit"
                    >
                      {{ getTaskNumber(key) }}
                    </span>

                    <div class="flex-1 min-w-0">
                      <!-- Task Text -->
                      <div
                        class="prose prose-sm max-w-none mb-4"
                        v-html="variant[key]?.text || 'Вопрос не задан'"
                      ></div>

                      <!-- Answer Toggle -->
                      <div class="mt-4 pt-4 border-t">
                        <button
                          @click="toggleAnswer(key)"
                          class="text-sm text-[#bd5343] hover:text-[#ab4a3c] font-medium transition"
                        >
                          {{
                            showAnswers[key]
                              ? '✓ Скрыть ответ'
                              : '▶ Показать ответ'
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

            <!-- Part 2: Tasks 12–16 -->
            <section>
              <h2
                class="text-xl font-bold text-gray-900 border-b-2 border-gray-900 pb-3 mb-6"
              >
                Часть 2. Задания с развёрнутым ответом
              </h2>

              <div class="space-y-6">
                <div
                  v-for="key in longTasks"
                  :key="key"
                  class="bg-white rounded-lg shadow p-6"
                >
                  <div class="flex gap-4">
                    <span
                      class="bg-gray-900 text-white px-3 py-1 text-sm font-bold rounded flex-shrink-0 h-fit"
                    >
                      {{ getTaskNumber(key) }}
                    </span>

                    <div class="flex-1">
                      <div
                        class="prose prose-sm max-w-none font-medium mb-2"
                        v-html="variant[key]?.text || 'Вопрос не задан'"
                      ></div>
                      <p class="mt-3 text-sm text-gray-500 italic">
                        Требуется написание сочинения (от 5 до 20 предложений).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
/* From React implementation: NewTestGlobalStyles and responsive design */
/* Print styles - from React: no-print class for hiding elements when printing */

.prose p {
  margin-bottom: 0.5rem;
}

/* Animation for variant transitions - from React: scene-animate class */
.scene-animate {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0.9;
  }
  to {
    opacity: 1;
  }
}

/* Responsive adjustments for Figma breakpoints */
@media (max-width: 1024px) {
  aside {
    display: none !important;
  }
}

/* Print styles - from React implementation */
@media print {
  .no-print {
    display: none !important;
  }

  .print-area {
    box-shadow: none;
  }

  .bg-gray-50 {
    background-color: white !important;
  }
}
</style>
