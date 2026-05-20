<script setup lang="ts">
defineProps<{
  blockBtns: boolean;
}>();

const { isAuthenticated } = useAuth();
const { generateVariant, refreshAllTasks } = useGenerateVariant();
const { showPaywall } = useSubscription();

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
    <!-- Action Panel for download/print/save/share -->
    <VariantActionPanel
      :disabled="blockBtns || !isAuthenticated"
      class="mb-5"
    />

    <div class="flex items-center justify-between mb-[20px] gap-3">
      <WhiteButton
        icon="i-lucide-file"
        class="white-btn w-full h-[50px] whitespace-nowrap"
        :disabled="blockBtns || !isAuthenticated"
        @click="handleNewVariant"
      >
        Новый рандомный вариант
      </WhiteButton>

      <WhiteButton
        icon="i-lucide-rotate-cw"
        class="white-btn w-full h-[50px] whitespace-nowrap"
        :disabled="blockBtns || !isAuthenticated"
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
  </div>
</template>
