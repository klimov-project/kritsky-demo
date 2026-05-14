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
const activeTab = computed({
  get: () => (route.query.modal === 'register' ? 'register' : 'login'),
  set: (value: string) => {
    router.replace({
      path: route.path,
      query: { ...route.query, modal: value },
    });
  },
});

const email = ref('');
const password = ref('');
const name = ref('');
const localError = ref('');
const isSubmitting = ref(false);

const consentOffer = ref(true);
const consentPrivacy = ref(true);
const consentAds = ref(true);

// Computed
const isRegisterConsentInvalid = computed(
  () =>
    activeTab.value === 'register' &&
    (!consentOffer.value || !consentPrivacy.value || !consentAds.value),
);

const isFormValid = computed(() => {
  if (activeTab.value === 'login') {
    return email.value.trim() && password.value.trim();
  }
  return (
    name.value.trim() &&
    email.value.trim() &&
    password.value.trim() &&
    !isRegisterConsentInvalid.value
  );
});

// Methods
const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value || isLoading.value) return;

  isSubmitting.value = true;
  localError.value = '';

  try {
    if (activeTab.value === 'login') {
      await login(email.value, password.value);
    } else {
      await register(email.value, password.value, name.value);
    }
    closeLoginModal();
    // Reset form
    email.value = '';
    password.value = '';
    name.value = '';
  } catch {
    localError.value =
      (authError.value as string) || 'Ошибка при авторизации';
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => {
  closeLoginModal();
  // Reset form state
  email.value = '';
  password.value = '';
  name.value = '';
  localError.value = '';
};

// Reset error when switching tabs
watch(activeTab, () => {
  localError.value = '';
});

// Tab items for UTabs
const tabItems = [
  { label: 'Вход', value: 'login' },
  { label: 'Регистрация', value: 'register' },
];
</script>

<template>
  <UModal
    :open="isLoginModalOpen"
    :title="activeTab === 'login' ? 'Вход' : 'Регистрация'"
    @update:open="(value) => !value && handleClose()"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Tab Toggle -->
        <UTabs v-model="activeTab" :items="tabItems" class="w-full" />

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Name Field (Register Only) -->
          <UFormField v-if="activeTab === 'register'" name="name" label="Ваше имя">
            <UInput
              v-model="name"
              type="text"
              placeholder="Введите ваше имя"
              autocomplete="name"
              size="lg"
            />
          </UFormField>

          <!-- Email Field -->
          <UFormField name="email" label="E-mail">
            <UInput
              v-model="email"
              type="email"
              placeholder="Введите вашу почту"
              autocomplete="email"
              required
              size="lg"
            />
          </UFormField>

          <!-- Password Field -->
          <UFormField name="password" label="Пароль">
            <UInput
              v-model="password"
              type="password"
              :placeholder="
                activeTab === 'login' ? 'Введите пароль' : 'Придумайте пароль'
              "
              :autocomplete="
                activeTab === 'login' ? 'current-password' : 'new-password'
              "
              required
              size="lg"
            />
          </UFormField>

          <!-- Error Message -->
          <UAlert
            v-if="localError"
            color="error"
            icon="i-lucide-alert-circle"
            :title="localError"
          />

          <!-- Register Consents -->
          <div v-if="activeTab === 'register'" class="space-y-3 py-2">
            <UCheckbox v-model="consentOffer" label="Я согласен получать информацию о предложениях" />
            <UCheckbox v-model="consentPrivacy">
              <template #label>
                <span class="text-sm">
                  Я согласен с
                  <NuxtLink to="/privacy" class="text-blue-600 hover:underline" @click="handleClose">
                    политикой конфиденциальности
                  </NuxtLink>
                </span>
              </template>
            </UCheckbox>
            <UCheckbox v-model="consentAds">
              <template #label>
                <span class="text-sm">
                  Я согласен с
                  <NuxtLink to="/terms" class="text-blue-600 hover:underline" @click="handleClose">
                    условиями использования
                  </NuxtLink>
                </span>
              </template>
            </UCheckbox>
          </div>

          <!-- Submit Button -->
          <UButton
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            :loading="isSubmitting"
            block
            size="lg"
            class="mt-4"
          >
            {{
              activeTab === 'login' ? 'Войти' : 'Создать аккаунт'
            }}
          </UButton>
        </form>
      </div>
    </template>
  </UModal>
</template>
