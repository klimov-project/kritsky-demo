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
const isLoading = computed(() => isSaving.value || isDownloadingPdf.value);

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

// const handleDownload = () => onSubmit();
// const handlePrint = () => console.log('click handlePrint');
// const handleSave = () => console.log('click handleSave');
// const handleShare = () => console.log('click handleShare');
</script>

<template>
  <div
    class="shadow-custom fixed z-10 bottom-0 mx-auto max-w-[1440px] w-full px-3 lg:px-8 py-2 lg:py-6 flex-1 bg-white rounded-[10px_10px_0_0] p-5 shadow-sm"
  >
    <!-- Прогресс-бар Nuxt UI - появляется только при загрузке -->
    <UProgress
      v-if="isLoading"
      animation="swing"
      size="sm"
      class="absolute top-0 left-0 right-0"
    />

    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
      <!-- Левая информационная часть -->
      <div class="flex flex-wrap gap-8">
        <h3 class="text-2xl font-normal leading-7 uppercase text-default">
          ПАНЕЛЬ <br />
          ВАРИАНТА
        </h3>
        <div
          class="text-xl flex flex-col items-start justify-center leading-6 text-gray-300"
        >
          <p>
            Осталось бесплатных скачиваний:
            <span class="font-semibold text-gray-400">3 из 3</span>
          </p>
          <p>
            Платных в запасе:
            <span class="font-semibold text-gray-400">0</span>
          </p>
        </div>
      </div>

      <!-- Правая группа кнопок -->
      <div class="flex flex-wrap gap-3">
        <!-- Download PDF -->
        <BaseButton
          icon="i-lucide-download"
          :disabled="disabled || isDownloadingPdf || !variant"
          :loading="isDownloadingPdf"
          @click="handleDownload"
        >
          {{ isDownloadingPdf ? 'ЗАГРУЗКА...' : 'СКАЧАТЬ' }}
        </BaseButton>

        <!-- Print -->
        <BaseButton
          icon="i-lucide-printer"
          :disabled="disabled || !variant"
          @click="handlePrint"
        >
          <span class="hidden sm:inline">Печать</span>
          <span class="sm:hidden">Печать</span>
        </BaseButton>

        <!-- Save to Profile -->
        <!-- icon="i-lucide-bookmark" -->
        <BaseButton
          icon="i-lucide-save"
          :disabled="disabled || isSaving || !variant"
          :loading="isSaving"
          @click="handleSave"
        >
          <span class="hidden sm:inline">Сохранить</span>
          <span class="sm:hidden">Сохранить</span>
        </BaseButton>

        <!-- Share -->
        <!-- icon="i-lucide-share-2" -->
        <BaseButton
          icon="i-lucide-forward"
          :disabled="disabled || !variant"
          @click="handleShare"
        >
          <span class="hidden sm:inline">Поделиться</span>
          <span class="sm:hidden">Поделиться</span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.shadow-custom {
  box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.07);
}
</style>
