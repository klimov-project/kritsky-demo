<script setup lang="ts"></script>

<template>
  <div
    class="shadow-custom fixed z-10 bottom-0 mx-auto max-w-[1440px] w-full px-3 lg:px-8 py-2 lg:py-6 flex-1 bg-white rounded-[10px_10px_0_0] p-5 shadow-sm"
  >
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
      <!-- Левая информационная часть -->
      <div class="flex flex-wrap gap-5">
        <h3
          class="font-normal text-lg leading-7 uppercase text-default"
        >
          ПАНЕЛЬ <br />
          ВАРИАНТА
        </h3>
        <div
          class="flex flex-col items-start justify-center text-lg leading-6 text-gray-300"
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
        <UButton
          icon="i-heroicons-arrow-down-tray"
          color="primary"
          variant="solid"
          size="md"
        >
          СКАЧАТЬ
        </UButton>

        <UButton
          icon="i-heroicons-printer"
          color="neutral"
          variant="outline"
          size="md"
        >
          ПЕЧАТЬ
        </UButton>

        <UButton
          icon="i-heroicons-document"
          color="neutral"
          variant="outline"
          size="md"
        >
          СОХРАНИТЬ
        </UButton>

        <UButton
          icon="i-heroicons-sparkles"
          color="primary"
          variant="outline"
          size="md"
        >
          ПОДПИСАТЬСЯ
        </UButton>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
.shadow-custom {
  box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.07);
}
</style>
