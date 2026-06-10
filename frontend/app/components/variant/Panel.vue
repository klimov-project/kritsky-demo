<script setup lang="ts">
const variantsStore = useVariantsStore();

const { isAuthenticated, user } = useAuth();
const { showPaywall } = useSubscription();
const { printVariant } = useVariantExport();
const disabled = computed(
  () => variantsStore.isLoading || !isAuthenticated.value || !user.value.isPro,
);
const open = ref(false);

const { generatePdf, isDownloadingPdf, collectAllAnswers } = useVariantPdf();

const handleDownload = async () => {
  if (!isAuthenticated.value) {
    showPaywall();
    return;
  }
  try {
    collectAllAnswers();
    await generatePdf();
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

const handlePrint = () => {
  if (!isAuthenticated.value) {
    showPaywall();
    return;
  }
  collectAllAnswers();
  printVariant();
};
</script>

<template>
  <UPopover v-model:open="open" arrow mode="hover">
    <div class="flex flex-wrap gap-3">
      <BaseButton
        icon="i-lucide-download"
        @click="handleDownload"
        :disabled="disabled"
      >
        {{ isDownloadingPdf ? 'ЗАГРУЗКА...' : 'СКАЧАТЬ' }}
      </BaseButton>

      <BaseButton
        icon="i-lucide-printer"
        @click="handlePrint"
        :disabled="disabled"
      >
        ПЕЧАТЬ
      </BaseButton>
    </div>
    <template #content>
      <HoverPaywall v-if="!user.value.isPro" @click="open = false" />
    </template>
  </UPopover>
</template>
