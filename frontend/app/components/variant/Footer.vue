<script setup lang="ts">
defineProps<{
  blockBtns: boolean;
}>();

const { isAuthenticated, isLocked } = useAuth();
const { pending: kbPending, error: kbError } = useKnowledgeBase();
const { statusMessage } = useVariantState();
const { generateVariant, refreshAllTasks } = useGenerateVariant();
const { showPaywall } = useSubscription();

const hasError = computed(() => !!kbError.value || !!statusMessage.value);

const handleNewVariant = async () => {
  if (!isAuthenticated.value) {
    showPaywall();
    return;
  }
  await generateVariant();
};

const handleRefreshAll = async () => {
  if (!isAuthenticated.value) {
    showPaywall();
    return;
  }
  await refreshAllTasks();
};
</script>

<template>
  <div class="w-full">
    <div
      v-if="hasError"
      class="bg-red-50 border border-red-200 rounded-lg p-6 mb-3"
    >
      <p class="text-red-700">
        {{
          statusMessage ||
          'Ошибка загрузки данных. Пожалуйста, попробуйте позже.'
        }}
      </p>
      <button
        @click="generateVariant"
        class="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
      >
        Повторить загрузку
      </button>
    </div>

    <div class="flex items-center justify-between mb-[20px] gap-3">
      <WhiteButton
        icon="i-lucide-file"
        class="white-btn w-full h-[50px] whitespace-nowrap"
        :disabled="blockBtns"
        :isLocked="isLocked"
        @click="handleNewVariant"
      >
        Новый рандомный вариант
      </WhiteButton>

      <WhiteButton
        icon="i-lucide-rotate-cw"
        class="white-btn w-full h-[50px] whitespace-nowrap"
        :disabled="blockBtns"
        :isLocked="isLocked"
        @click="handleRefreshAll"
      >
        Обновить все задания в варианте
      </WhiteButton>
    </div>
    <!-- <div   class="flex items-center justify-between mb-3 gap-3">
      <WhiteButton previous @click="handleNav('next')" :disabled="blockBtns">
        Предыдущий вариант
      </WhiteButton>

      <WhiteButton next @click="handleNav('previous')" :disabled="blockBtns">
        Следующий вариант
      </WhiteButton>
    </div> -->

    <!-- Action Panel for download/print/save/share -->
    <VariantActionPanel
      :disabled="blockBtns || !isAuthenticated"
      class="mb-5"
    />
  </div>
</template>
