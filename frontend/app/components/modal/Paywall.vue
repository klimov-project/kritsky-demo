<!-- components/PaywallModal.vue -->
<script setup lang="ts">
const router = useRouter();
const { isAuthenticated, openLoginModal } = useAuth();
const { isPaywallOpen, closePaywall } = useSubscription();

const title = 'Ограниченный доступ';

const description = computed(() => {
  if (!isAuthenticated.value) {
    return 'Для обновления целого блока заданий необходимо войти в аккаунт и приобрести подписку.';
  }
  return 'Выбор отрывка доступен только по подписке.';
});

const handleRegister = () => {
  closePaywall();
  openLoginModal('register');
};

const handleSubscribe = () => {
  closePaywall();
  router.push('/payments');
};

const handleSubscriptionsInfo = () => {
  closePaywall();
  router.push('/subscriptions');
};

const handleLater = () => {
  closePaywall();
};
</script>

<template>
  <BaseModal :open="isPaywallOpen" :title="title" @close="handleLater">
    <div class="space-y-4">
      <p class="text-base text-gray-700 leading-relaxed">
        {{ description }}
      </p>

      <a
        v-if="!isAuthenticated"
        href="/subscriptions"
        class="text-primary-600 hover:text-primary-700 underline text-sm font-medium inline-block"
        @click.prevent="handleSubscriptionsInfo"
      >
        Подробнее о подписках
      </a>
    </div>

    <template #footer>
      <template v-if="!isAuthenticated">
        <PrimaryButton class="w-full" @click="handleRegister">
          Зарегистрироваться
        </PrimaryButton>
        <BaseButton class="w-full text-sm" @click="handleLater">
          Позже
        </BaseButton>
      </template>

      <template v-else>
        <PrimaryButton class="w-full" @click="handleSubscribe">
          Оформить подписку
        </PrimaryButton>
        <BaseButton class="w-full text-sm" @click="handleLater">
          Позже
        </BaseButton>
      </template>
    </template>
  </BaseModal>
</template>
