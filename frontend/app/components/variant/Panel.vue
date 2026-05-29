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
    >
      {{ isDownloadingPdf ? 'ЗАГРУЗКА...' : 'СКАЧАТЬ' }}
    </BaseButton>

    <BaseButton
      icon="i-lucide-printer"
      @click="handlePrint"
    >
      ПЕЧАТЬ
    </BaseButton>
    <BaseButton
      icon="i-lucide-save"
      @click="handleSave"
    >
      СОХРАНИТЬ
    </BaseButton>
    <BaseButton
      icon="i-lucide-share-2"
      @click="handleShare"
    >
      ПОДЕЛИТЬСЯ
    </BaseButton>
  </div>
</template>
