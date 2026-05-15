<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const auth = useAuth();
const {
  login,
  register,
  isLoading,
  error: authError,
  isLoginModalOpen,
  closeLoginModal,
} = auth;

// State
const email = ref('');
const password = ref('');
const name = ref('');
const localError = ref<string | null>(null);
const isSubmitting = ref(false);

const consentOffer = ref(true);
const consentPrivacy = ref(true);
const consentAds = ref(true);

const activeTab = computed<'login' | 'register'>(
  () => (route.query.modal as 'login' | 'register') || 'login',
);

const isRegisterConsentInvalid = computed(
  () =>
    activeTab.value === 'register' &&
    (!consentOffer.value || !consentPrivacy.value || !consentAds.value),
);

const isFormValid = computed(() => {
  if (activeTab.value === 'login') {
    return email.value && password.value;
  }
  return (
    name.value &&
    email.value &&
    password.value &&
    !isRegisterConsentInvalid.value
  );
});

watch(authError, (newError) => {
  if (newError) {
    localError.value = newError;
  }
});

watch(activeTab, () => {
  localError.value = null;
});

watch(isLoginModalOpen, (isOpen) => {
  if (!isOpen) {
    localError.value = null;
  }
});

const handleLogin = async () => {
  if (!isFormValid.value) return;

  isSubmitting.value = true;
  localError.value = null;

  try {
    if (activeTab.value === 'login') {
      await login(email.value, password.value);
      handleClose();
    } else {
      await register(email.value, password.value, name.value);
      handleClose();
    }
  } catch (err) {
    console.error('Auth error:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const handlePhoneLogin = () => {
  localError.value = 'Пока доступен только вход по e-mail.';
};

const handleClose = () => {
  closeLoginModal();
  email.value = '';
  password.value = '';
  name.value = '';
  localError.value = null;
  router.replace({
    path: route.path,
    query: { ...route.query, modal: undefined },
  });
};

// Сбрасываем ошибку при смене таба
watch(activeTab, () => {
  localError.value = '';
});
</script>

<template>
  <BaseModal
    v-model:open="isLoginModalOpen"
    :error="localError"
    @close="handleClose"
    :title="activeTab === 'login' ? 'Вход в аккаунт' : 'Регистрация'"
  >
    <form @submit.prevent="handleLogin">
      <div class="space-y-5">
        <BaseInput
          v-if="activeTab === 'register'"
          v-model="name"
          label="ИМЯ"
          placeholder="Введите ваше имя"
        />

        <BaseInput
          v-model="email"
          label="EMAIL"
          placeholder="Введите вашу почту"
          type="email"
          required
        />

        <BaseInput
          v-model="password"
          label="ПАРОЛЬ"
          placeholder="Введите пароль"
          type="password"
          required
        />
      </div>
    </form>

    <template #footer>
      <BaseButton class="w-full text-sm" @click="handlePhoneLogin">
        По номеру
      </BaseButton>

      <PrimaryButton
        type="submit"
        :disabled="!isFormValid || isSubmitting"
        :loading="isSubmitting"
        @click="handleLogin"
      >
        {{ activeTab === 'login' ? 'Войти' : 'Зарегистрироваться' }}
      </PrimaryButton>

      <AuthToggleRegisterBtn />
    </template>
  </BaseModal>
</template>
