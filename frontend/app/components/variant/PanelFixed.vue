<script setup lang="ts">
interface FooterVariantProps {
  blockBtns?: boolean;
  isDemo?: boolean;
}
withDefaults(defineProps<FooterVariantProps>(), {
  blockBtns: false,
  isDemo: false,
});

const { isAuthenticated, isLocked, openLoginModal } = useAuth();
const variantsStore = useVariantsStore();
const isLoading = computed(() => variantsStore.isLoading);
const handleRegister = () => {
  openLoginModal('register');
};
</script>

<template>
  <div
    class="shadow-custom fixed z-100 bottom-0 max-w-[1440px] left-0 right-0 mx-auto w-full bg-white rounded-[10px_10px_0_0] shadow-sm"
  >
    <UProgress
      v-if="isLoading"
      animation="swing"
      size="sm"
      class="absolute top-0 left-0 right-0"
    />

    <div
      class="max-w-[1440px] mx-auto px-3 py-2 md:px-4 md:py-3 lg:px-8 lg:py-6"
    >
      <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 lg:gap-6"
      >
        <!-- Левая часть -->
        <div
          class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:gap-8"
        >
          <h3
            class="text-lg sm:text-xl lg:text-2xl font-normal leading-5 sm:leading-6 lg:leading-7 uppercase text-default"
          >
            ПАНЕЛЬ <br class="hidden sm:block" />
            ВАРИАНТА
          </h3>
          <div
            class="text-sm sm:text-base lg:text-xl flex flex-col items-start justify-center leading-5 sm:leading-6 text-gray-300"
          >
            <p v-if="isDemo">
              Статус:
              <span class="font-semibold text-gray-400">
                Демонстрационный режим
              </span>
            </p>
            <p v-else>
              Статус:
              <span class="font-semibold text-gray-400">
                {{ isLocked ? 'Базовый доступ' : 'Подписка активна' }}
              </span>
            </p>
            <p v-if="!isAuthenticated" class="text-xs sm:text-sm mt-0.5">
              <a
                href="#"
                class="text-primary-600 hover:text-primary-700 underline font-medium inline-block"
                @click.prevent="handleRegister"
              >
                Зарегистрируйтесь
              </a>
              для проверки всех функций
            </p>
          </div>
        </div>

        <!-- Правая часть (кнопки) -->
        <div class="w-full md:w-auto">
          <DemoPanel v-if="isDemo" />
          <VariantPanel v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.shadow-custom {
  box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.07);
}
</style>
