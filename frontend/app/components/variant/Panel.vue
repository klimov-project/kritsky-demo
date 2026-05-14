<script setup lang="ts">
const handleDownload = () => onSubmit();
const handlePrint = () => console.log('click handlePrint');
const handleSave = () => console.log('click handleSave');
const handleShare = () => console.log('click handleShare');

const isLoading = ref(false);

async function onSubmit() {
  isLoading.value = true;

  console.log('Имитация загрузки ');
  await new Promise((resolve) => setTimeout(resolve, 7000));

  console.log('Загружено ');

  isLoading.value = false;
}
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
        <BaseButton
          icon="i-lucide-download"
          @click="handleDownload"
          :disabled="isLoading"
        >
          {{ isLoading ? 'ЗАГРУЗКА...' : 'СКАЧАТЬ' }}
        </BaseButton>
        <BaseButton
          icon="i-lucide-printer"
          @click="handlePrint"
          :disabled="isLoading"
        >
          ПЕЧАТЬ
        </BaseButton>
        <BaseButton
          icon="i-lucide-save"
          @click="handleSave"
          :disabled="isLoading"
        >
          СОХРАНИТЬ
        </BaseButton>
        <BaseButton
          icon="i-lucide-forward"
          @click="handleShare"
          :disabled="isLoading"
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
