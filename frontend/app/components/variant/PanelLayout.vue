<script setup lang="ts">
interface VariantPanelProps {
  isDemo: boolean;
}
withDefaults(defineProps<VariantPanelProps>(), {
  isDemo: false,
});
const { user, isAuthenticated, openLoginModal } = useAuth();
const handleRegister = () => {
  openLoginModal('register');
};
</script>

<template>
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
      v-if="isDemo"
      class="text-sm sm:text-base lg:text-xl flex flex-col items-start justify-center leading-5 sm:leading-6 text-gray-300"
    >
      <p>
        Статус:
        <span class="font-semibold text-gray-400">
          Демонстрационный режим
        </span>
      </p>
    </div>
    <div
      v-else-if="user"
      class="text-sm sm:text-base lg:text-xl flex flex-col items-start justify-center leading-5 sm:leading-6 text-gray-300"
    >
      <p>
        Статус:
        <span class="font-semibold text-gray-400">
          {{ user.isPro ? 'Подписка активна' : 'Без подписки' }}
        </span>
      </p>
      <p v-if="!user.isPro" class="text-xs sm:text-sm mt-0.5">
        <a
          href="/profile/subscription"
          class="text-primary-600 hover:text-primary-700 underline font-medium inline-block"
        >
          Получите полный доступ
        </a>
        ко всем функциям сервиса
      </p>
      <p v-else class="downloads-left">
        Осталось скачиваний 3 из 3
      </p>
    </div>
    <div
      v-else
      class="text-sm sm:text-base lg:text-xl flex flex-col items-start justify-center leading-5 sm:leading-6 text-gray-300"
    >
      <p>
        Статус:
        <span class="font-semibold text-gray-400"> Базовый доступ </span>
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
</template>

<style lang="scss"></style>
