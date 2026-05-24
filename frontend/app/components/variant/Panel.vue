<script setup lang="ts">
/**
 * Constructor action panel with download, print, save, and share buttons
 */
defineProps<{
  disabled?: boolean;
}>();

const { isAuthenticated, isLocked } = useAuth();
const { showPaywall } = useSubscription();
const {
  downloadVariantPdf,
  printVariant,
  saveVariantToProfile,
  generateShareableLink,
} = useVariantExport();

const isLoading = ref(false);

const handleDownload = async () => {
  if (!isAuthenticated.value) {
    showPaywall();
    return;
  }
  isLoading.value = true;
  try {
    await downloadVariantPdf();
  } finally {
    isLoading.value = false;
  }
};

const handlePrint = () => {
  if (!isAuthenticated.value) {
    showPaywall();
    return;
  }
  printVariant();
};

const handleSave = async () => {
  if (!isAuthenticated.value) {
    showPaywall();
    return;
  }
  isLoading.value = true;
  try {
    await saveVariantToProfile();
  } finally {
    isLoading.value = false;
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
  <div
    class="shadow-custom fixed z-10 bottom-0 mx-auto max-w-[1440px] w-full px-3 lg:px-8 py-2 lg:py-6 flex-1 bg-white rounded-[10px_10px_0_0] p-5 shadow-sm"
  >
    <!-- Progress bar -->
    <UProgress
      v-if="isLoading"
      animation="swing"
      size="sm"
      class="absolute top-0 left-0 right-0"
    />

    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
      <!-- Left info section -->
      <div class="flex flex-wrap gap-8">
        <h3 class="text-2xl font-normal leading-7 uppercase text-default">
          ПАНЕЛЬ <br />
          ВАРИАНТА
        </h3>
        <div
          class="text-xl flex flex-col items-start justify-center leading-6 text-gray-300"
        >
          <p>
            Статус:
            <span class="font-semibold text-gray-400">
              {{ isLocked ? 'Базовый доступ' : 'Подписка активна' }}
            </span>
          </p>
          <p v-if="!isAuthenticated" class="text-sm">
            Зарегистрируйтесь для проверки всех функций
          </p>
        </div>
      </div>

      <!-- Right buttons group -->
      <div class="flex flex-wrap gap-3">
        <BaseButton
          icon="i-lucide-download"
          @click="handleDownload"
          :disabled="disabled || isLoading || !isAuthenticated"
        >
          {{ isLoading ? 'ЗАГРУЗКА...' : 'СКАЧАТЬ' }}
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
          :disabled="disabled || isLoading || !isAuthenticated"
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
    </div>
  </div>
</template>

<style lang="scss">
.shadow-custom {
  box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.07);
}
</style>
