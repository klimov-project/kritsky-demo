<script setup lang="ts">
/**
 * Constructor action panel with download, print, save, and share buttons
 */
defineProps<{
  disabled?: boolean;
}>();

const { variant } = useVariantState();
const { isAuthenticated, openLoginModal } = useAuth();
const {
  downloadVariantPdf,
  printVariant,
  saveVariantToProfile,
  shareVariant,
  isDownloadingPdf,
} = useVariantExport();

const isSaving = ref(false);

const handleDownload = async () => {
  if (!isAuthenticated.value) {
    openLoginModal();
    return;
  }
  await downloadVariantPdf('variant-content');
};

const handlePrint = () => {
  if (!isAuthenticated.value) {
    openLoginModal();
    return;
  }
  printVariant('variant-content');
};

const handleSave = async () => {
  if (!variant.value) return;

  isSaving.value = true;
  try {
    await saveVariantToProfile(variant.value);
  } finally {
    isSaving.value = false;
  }
};

const handleShare = async () => {
  if (!variant.value) return;
  await shareVariant(variant.value);
};
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-center gap-3 p-4 bg-gray-50 rounded-2xl"
  >
    <!-- Download PDF -->
    <WhiteButton
      icon="i-lucide-download"
      :disabled="disabled || isDownloadingPdf || !variant"
      :loading="isDownloadingPdf"
      class="h-[44px] px-4"
      @click="handleDownload"
    >
      <span class="hidden sm:inline">Скачать PDF</span>
      <span class="sm:hidden">PDF</span>
    </WhiteButton>

    <!-- Print -->
    <WhiteButton
      icon="i-lucide-printer"
      :disabled="disabled || !variant"
      class="h-[44px] px-4"
      @click="handlePrint"
    >
      <span class="hidden sm:inline">Печать</span>
      <span class="sm:hidden">Печать</span>
    </WhiteButton>

    <!-- Save to Profile -->
    <WhiteButton
      icon="i-lucide-bookmark"
      :disabled="disabled || isSaving || !variant"
      :loading="isSaving"
      class="h-[44px] px-4"
      @click="handleSave"
    >
      <span class="hidden sm:inline">Сохранить</span>
      <span class="sm:hidden">Сохранить</span>
    </WhiteButton>

    <!-- Share -->
    <WhiteButton
      icon="i-lucide-share-2"
      :disabled="disabled || !variant"
      class="h-[44px] px-4"
      @click="handleShare"
    >
      <span class="hidden sm:inline">Поделиться</span>
      <span class="sm:hidden">Поделиться</span>
    </WhiteButton>
  </div>
</template>
