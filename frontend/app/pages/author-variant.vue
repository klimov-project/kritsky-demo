<script setup lang="ts">
import type { SavedVariant } from '@/stores/variants';

const variantId = computed(() => 1);

const variantsStore = useVariantsStore();
const knowledgeStore = useKnowledgeBaseStore();
const { variant, isInitialLoading } = useVariantState();
const { downloadVariantPdf, printVariant } = useVariantExport();

const savedVariant = ref<SavedVariant | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const config = useRuntimeConfig();
const apiUrl = config.public.apiUrl;

// Load variant on mount
onMounted(async () => {
  try {
    // Try to fetch from API
    const response = await $fetch<SavedVariant>(
      `${apiUrl}/variants/${variantId.value}`,
    );
    savedVariant.value = response;

    // Set the variant in state for rendering
      if (response?.variant) {
        variant.value = response.variant;
      }
  } catch (err) {
    // Check if variant exists in local store
    const localVariant = variantsStore.getVariantById(variantId.value);
    if (localVariant) {
      savedVariant.value = localVariant;
      variant.value = localVariant.variant;
    } else {
      error.value = 'Вариант не найден';
    }
  } finally {
    isLoading.value = false;
  }
});

const handleDownload = () => {
  downloadVariantPdf('variant-content');
};

const handlePrint = () => {
  printVariant('variant-content');
};
</script>

<template>
  <div class="min-h-screen py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <UIcon
          name="i-lucide-loader-2"
          class="w-10 h-10 text-gray-400 animate-spin"
        />
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-20 text-center"
      >
        <UIcon name="i-lucide-file-x" class="w-16 h-16 text-gray-300 mb-4" />
        <h2 class="text-xl font-semibold text-gray-700 mb-2">
          {{ error }}
        </h2>
        <p class="text-gray-500 mb-6">
          Зайдите позже, или попробуйте:
        </p>
        <NuxtLink
          to="/create-variant"
          class="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Создать свой вариант
        </NuxtLink>
      </div>

      <!-- Variant Content (read-only full layout) -->
      <template v-else-if="savedVariant || knowledgeStore.weeklyVariant">
        <div class="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-2xl font-bold">
                {{
                  savedVariant
                    ? variantsStore.getVariantTitle(savedVariant.variant)
                    : 'Вариант недели'
                }}
              </h1>
              <p class="text-gray-500 mt-1">
                {{
                  savedVariant
                    ? `Создан: ${variantsStore.formatDate(savedVariant.createdAt)}`
                    : 'Только для просмотра'
                }}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                v-if="savedVariant"
                class="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Скачать PDF"
                @click="handleDownload"
              >
                <UIcon name="i-lucide-download" class="w-5 h-5" />
              </button>
              <button
                v-if="savedVariant"
                class="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Печать"
                @click="handlePrint"
              >
                <UIcon name="i-lucide-printer" class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div id="variant-content" class="bg-white rounded-2xl p-6 shadow-sm">
          <div class="prose max-w-none">
            <!-- Work info -->
            <div
              v-if="(savedVariant && savedVariant.variant.work) || (!savedVariant && knowledgeStore.weeklyVariant?.work)"
              class="mb-8 pb-6 border-b"
            >
              <h2 class="text-xl font-semibold mb-2">
                {{
                  savedVariant
                    ? savedVariant.variant.work.author
                    : knowledgeStore.weeklyVariant?.work?.author
                }}
              </h2>
              <p class="text-lg text-gray-600">
                {{
                  savedVariant
                    ? savedVariant.variant.work.title
                    : knowledgeStore.weeklyVariant?.work?.title
                }}
              </p>
            </div>

            <!-- Full read-only variant layout using existing components -->
            <ClientOnly>
              <VariantExcerpt
                :excerpt-text="(savedVariant && savedVariant.variant.excerpt?.text) || (!savedVariant && knowledgeStore.weeklyVariant?.excerpt?.text)"
                :text-columns="(savedVariant && savedVariant.variant.excerpt?.textColumns) || (!savedVariant && knowledgeStore.weeklyVariant?.excerpt?.textColumns)"
                :text-second-column="(savedVariant && savedVariant.variant.excerpt?.textSecondColumn) || (!savedVariant && knowledgeStore.weeklyVariant?.excerpt?.textSecondColumn)"
                :excerpt-author="(savedVariant && savedVariant.variant.work?.author) || (!savedVariant && knowledgeStore.weeklyVariant?.work?.author)"
                :excerpt-work="(savedVariant && savedVariant.variant.work?.title) || (!savedVariant && knowledgeStore.weeklyVariant?.work?.title)"
              />

              <!-- Render tasks 1-5 (and more as present) using ReadOnlyTask -->
              <div class="space-y-4 mt-6">
                <ReadOnlyTask v-if="(savedVariant && savedVariant.variant.task1) || (!savedVariant && knowledgeStore.weeklyVariant?.task1)" task-key="task1" />
                <ReadOnlyTask v-if="(savedVariant && savedVariant.variant.task2) || (!savedVariant && knowledgeStore.weeklyVariant?.task2)" task-key="task2" />
                <ReadOnlyTask v-if="(savedVariant && savedVariant.variant.task3) || (!savedVariant && knowledgeStore.weeklyVariant?.task3)" task-key="task3" />
                <ReadOnlyTask v-if="(savedVariant && savedVariant.variant.task4_1) || (!savedVariant && knowledgeStore.weeklyVariant?.task4_1)" task-key="task4_1" />
                <ReadOnlyTask v-if="(savedVariant && savedVariant.variant.task5) || (!savedVariant && knowledgeStore.weeklyVariant?.task5)" task-key="task5" />
              </div>
            </ClientOnly>

            <p class="text-center text-gray-500 py-4">
              Для редактирования варианта откройте его в конструкторе
            </p>
          </div>
        </div>

        <!-- Back button -->
        <div class="mt-6 text-center">
          <NuxtLink
            to="/profile/my-variants"
            class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
            Вернуться к моим вариантам
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>
