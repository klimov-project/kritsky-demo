<script setup lang="ts">
const variantsStore = useVariantsStore();
const disabled = computed(() => variantsStore.isLoading);

const { isAuthenticated } = useAuth();
const { showPaywall } = useSubscription();
const {
  printVariant,
  saveVariantToProfile,
  generateShareableLink,
} = useVariantExport();

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

const handleSave = async () => {
  if (!isAuthenticated.value) {
    showPaywall();
    return;
  }
  try {
    await saveVariantToProfile();
  } catch (error) {
    console.error('Error saving variant:', error);
  }
};

const handleShare = async () => {
  if (!isAuthenticated.value) {
    showPaywall();
    return;
  }
  await generateShareableLink();
};
</script>

<template>
  <!-- Main buttons group -->
  <div class="flex flex-wrap gap-3">
    <BaseButton
      icon="i-lucide-download"
      @click="handleDownload"
      :disabled="disabled || !isAuthenticated"
    >
      {{ isDownloadingPdf ? 'ЗАГРУЗКА...' : 'СКАЧАТЬ' }}
    </BaseButton>

    <BaseButton
      icon="i-lucide-printer"
      @click="handlePrint"
      :disabled="disabled || !isAuthenticated"
    >
      ПЕЧАТЬ
    </BaseButton>
    <BaseButton
      icon="i-lucide-save"
      @click="handleSave"
      :disabled="disabled || !isAuthenticated"
    >
      СОХРАНИТЬ
    </BaseButton>
    <BaseButton
      icon="i-lucide-share-2"
      @click="handleShare"
      :disabled="disabled || !isAuthenticated"
    >
      ПОДЕЛИТЬСЯ
    </BaseButton>
  </div>
</template>
