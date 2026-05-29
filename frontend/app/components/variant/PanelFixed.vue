<script setup lang="ts">
const { isAuthenticated, isLocked } = useAuth();
const variantsStore = useVariantsStore();
const isLoading = computed(() => variantsStore.isLoading);
</script>

<template>
  <UPopover arrow mode="hover">
    <div
      class="shadow-custom fixed z-100 bottom-0 mx-auto max-w-[1440px] w-full px-3 lg:px-8 py-2 lg:py-6 flex-1 bg-white rounded-[10px_10px_0_0] p-5 shadow-sm"
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
              isAuthenticated: {{ isAuthenticated }}
            </p>
            <p v-if="!isAuthenticated" class="text-sm">
              Зарегистрируйтесь для проверки всех функций
            </p>
          </div>
        </div>

        <VariantPanel />
      </div>
    </div>

    <template #content>
      <HoverPaywall />
    </template>
  </UPopover>
</template>

<style lang="scss">
.shadow-custom {
  box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.07);
}
</style>
