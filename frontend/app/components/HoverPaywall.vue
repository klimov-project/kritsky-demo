<script setup lang="ts">
const router = useRouter();
const { isAuthenticated, openLoginModal } = useAuth();
const title = 'Ограниченный доступ';

const description = computed(() => {
  if (!isAuthenticated.value) {
    return 'Для обновления целого блока заданий необходимо войти в аккаунт и приобрести подписку.';
  }
  return 'Выбор отрывка доступен только по подписке.';
});

const handleRegister = () => {
  openLoginModal('register');
};

const handleSubscribe = () => {
  router.push('/profile/subscription');
};

const handleSubscriptionsInfo = () => {
  router.push('/subscriptions');
};

defineEmits(['click']);
</script>

<template>
  <div
    class="base-modal w-full bg-white rounded-[10px] p-[30px_40px_50px_30px]"
  >
    <div class="space-y-4">
      <h5 class="base-modal-title font-semibold text-default">{{ title }}</h5>
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

      <template v-if="!isAuthenticated">
        <PrimaryButton class="w-full" @click="handleRegister">
          Зарегистрироваться
        </PrimaryButton>
        <BaseButton class="w-full text-sm" @click="$emit('click')">
          Позже
        </BaseButton>
      </template>

      <template v-else>
        <PrimaryButton class="w-full" @click="handleSubscribe">
          Оформить подписку
        </PrimaryButton>
        <BaseButton class="w-full text-sm" @click="$emit('click')">
          Позже
        </BaseButton>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.base-modal {
  border: 0px solid;

  [data-slot='header'],
  [data-slot='body'],
  [data-slot='footer'] {
    border: 0px solid;
    margin-bottom: 30px;
  }

  [data-slot='header'] {
    padding: 57px 50px 0;
  }

  [data-slot='body'] {
    padding: 0 50px;
  }

  [data-slot='footer'] {
    padding: 0 50px;
  }

  .base-modal-close {
    position: absolute;
    top: -35px;
    right: -35px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: white !important;
    background-color: transparent !important;

    &:hover,
    &:active,
    &:focus {
      color: white !important;
      background-color: transparent !important;
    }
  }

  .base-modal-title {
    font-style: normal;
    font-weight: 400;
    font-size: 40px;
    line-height: 47px;
  }
}
</style>
