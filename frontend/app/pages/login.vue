<script setup lang="ts">
/**
 * Login page - redirects to modal or shows standalone form
 *
 * Supports both:
 * - /login route (standalone page)
 * - ?modal=login (modal overlay from any page)
 */
definePageMeta({
  layout: 'default',
});

const router = useRouter();
const route = useRoute();
const { login, register, isLoading, error: authError, isAuthenticated } = useAuth();

// Redirect if already authenticated
watch(
  isAuthenticated,
  (authenticated) => {
    if (authenticated) {
      const redirect = route.query.redirect as string;
      router.push(redirect || '/');
    }
  },
  { immediate: true },
);

// State
const activeTab = ref<'login' | 'register'>(
  (route.query.tab as 'login' | 'register') || 'login',
);
const email = ref('');
const password = ref('');
const name = ref('');
const error = ref('');
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
const handleSubmit = async (e: Event) => {
  e.preventDefault();
  if (!isFormValid.value || isSubmitting.value || isLoading.value) return;

  isSubmitting.value = true;
  error.value = '';

  try {
    if (activeTab.value === 'login') {
      await login(email.value, password.value);
    } else {
      await register(email.value, password.value, name.value);
    }
    const redirect = route.query.redirect as string;
    router.push(redirect || '/');
  } catch (err) {
    error.value =
      (authError.value as string) ||
      (err instanceof Error ? err.message : 'Ошибка при авторизации');
  } finally {
    isSubmitting.value = false;
  }
};

const toggleTab = () => {
  activeTab.value = activeTab.value === 'login' ? 'register' : 'login';
  error.value = '';
};
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4"
  >
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-blue-600 mb-2">Критский</h1>
        <p class="text-gray-600">Конструктор вариантов ЕГЭ по литературе</p>
      </div>

      <!-- Auth Card -->
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Tab Toggle -->
        <div class="flex gap-4 mb-8 border-b">
          <button
            @click="toggleTab"
            :class="[
              'pb-3 font-bold transition',
              activeTab === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-400 hover:text-gray-600',
            ]"
          >
            Вход
          </button>
          <button
            @click="toggleTab"
            :class="[
              'pb-3 font-bold transition',
              activeTab === 'register'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-400 hover:text-gray-600',
            ]"
          >
            Регистрация
          </button>
        </div>

        <!-- Form -->
        <form @submit="handleSubmit" class="space-y-4">
          <!-- Name Field (Register Only) -->
          <div v-if="activeTab === 'register'">
            <label
              class="block text-sm font-medium text-gray-700 uppercase tracking-wider mb-2"
            >
              Ваше имя
            </label>
            <input
              v-model="name"
              type="text"
              placeholder="Введите ваше имя"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autocomplete="name"
            />
          </div>

          <!-- Email Field -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 uppercase tracking-wider mb-2"
            >
              E-mail
            </label>
            <input
              v-model="email"
              type="email"
              placeholder="Введите вашу почту"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autocomplete="email"
              required
            />
          </div>

          <!-- Password Field -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 uppercase tracking-wider mb-2"
            >
              Пароль
            </label>
            <input
              v-model="password"
              type="password"
              :placeholder="
                activeTab === 'login' ? 'Введите пароль' : 'Придумайте пароль'
              "
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              :autocomplete="
                activeTab === 'login' ? 'current-password' : 'new-password'
              "
              required
            />
          </div>

          <!-- Error Message -->
          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm"
          >
            {{ error }}
          </div>

          <!-- Register Consents -->
          <div v-if="activeTab === 'register'" class="space-y-3 py-4">
            <label class="flex items-start gap-3 cursor-pointer">
              <input v-model="consentOffer" type="checkbox" class="mt-1" />
              <span class="text-xs text-gray-600">
                Я согласен получать информацию о предложениях
              </span>
            </label>
            <label class="flex items-start gap-3 cursor-pointer">
              <input v-model="consentPrivacy" type="checkbox" class="mt-1" />
              <span class="text-xs text-gray-600">
                Я согласен с
                <NuxtLink to="/privacy" class="text-blue-600 hover:underline">
                  политикой конфиденциальности
                </NuxtLink>
              </span>
            </label>
            <label class="flex items-start gap-3 cursor-pointer">
              <input v-model="consentAds" type="checkbox" class="mt-1" />
              <span class="text-xs text-gray-600">
                Я согласен с
                <NuxtLink to="/terms" class="text-blue-600 hover:underline">
                  условиями использования
                </NuxtLink>
              </span>
            </label>
          </div>

          <!-- Buttons -->
          <div class="space-y-3 pt-4">
            <button
              type="submit"
              :disabled="!isFormValid || isSubmitting"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {{
                isSubmitting
                  ? 'Загрузка...'
                  : activeTab === 'login'
                    ? 'Войти'
                    : 'Создать аккаунт'
              }}
            </button>
          </div>
        </form>

        <!-- Back to Home -->
        <div class="text-center mt-6 text-sm">
          <NuxtLink to="/" class="text-blue-600 hover:underline">
            Вернуться на главную
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
