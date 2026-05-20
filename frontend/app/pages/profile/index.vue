<script setup lang="ts">
/**
 * Profile page - displays user info and subscription status
 */
definePageMeta({
  middleware: 'auth',
  layout: 'profile',
});

const auth = useAuth();
const { user, logout } = auth;
const userStore = useUserStore();
const {
  quota,
  subscriptionExpiryFormatted,
  hasActiveSubscription,
} = storeToRefs(userStore);

const isLoading = ref(true);
const isEditing = ref(false);

// Form state for editing
const editForm = reactive({
  name: '',
  email: '',
  phone: '',
});

// Load user data and quota on mount
onMounted(async () => {
  try {
    await Promise.all([userStore.fetchUser(), userStore.fetchQuota()]);
    // Populate edit form with current user data
    if (userStore.user) {
      editForm.name = userStore.user.name || '';
      editForm.email = userStore.user.email || '';
      editForm.phone = userStore.user.phone || '';
    }
  } catch (error) {
    console.error('Failed to load profile data:', error);
  } finally {
    isLoading.value = false;
  }
});

const handleLogout = async () => {
  try {
    await logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

const startEditing = () => {
  if (userStore.user) {
    editForm.name = userStore.user.name || '';
    editForm.email = userStore.user.email || '';
    editForm.phone = userStore.user.phone || '';
  }
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
};

const saveProfile = async () => {
  try {
    await auth.updateProfile({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
    });
    await userStore.fetchUser();
    isEditing.value = false;
  } catch (error) {
    console.error('Failed to save profile:', error);
  }
};
</script>

<template>
  <!-- Header with tabs and logout -->
  <div
    class="flex items-center justify-between border-b border-gray-200 mb-8 pb-4"
  >
    <h1 class="text-2xl font-bold">Мой профиль</h1>
    <button
      class="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      @click="handleLogout"
    >
      <span>Выйти</span>
      <UIcon name="i-lucide-log-out" class="w-5 h-5" />
    </button>
  </div>

  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center py-12">
    <UIcon
      name="i-lucide-loader-2"
      class="w-8 h-8 text-gray-400 animate-spin"
    />
  </div>

  <template v-else>
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Subscription Card -->
      <div
        class="rounded-2xl p-6"
        :class="hasActiveSubscription ? 'bg-emerald-50' : 'bg-gray-50'"
      >
        <div class="flex items-start gap-4">
          <UIcon
            :name="hasActiveSubscription ? 'i-lucide-crown' : 'i-lucide-lock'"
            class="w-7 h-7 mt-1"
            :class="
              hasActiveSubscription ? 'text-emerald-600' : 'text-gray-500'
            "
          />
          <div>
            <p
              class="text-xs font-medium tracking-widest text-gray-500 uppercase"
            >
              Подписка
            </p>
            <p class="text-xl font-bold mt-2">
              {{
                hasActiveSubscription
                  ? `Активна до ${subscriptionExpiryFormatted}`
                  : 'Не активна'
              }}
            </p>
            <p class="text-sm text-gray-600 mt-3">
              {{
                hasActiveSubscription
                  ? 'Генерация без лимита'
                  : 'Ограниченный доступ'
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Daily Limit Card -->
      <div class="bg-gray-50 rounded-2xl p-6">
        <div class="flex items-start gap-4">
          <UIcon name="i-lucide-clock" class="w-7 h-7 text-gray-500 mt-1" />
          <div>
            <p
              class="text-xs font-medium tracking-widest text-gray-500 uppercase"
            >
              Ежедневный лимит
            </p>
            <p class="text-xl font-bold mt-2">
              Доступно: {{ quota?.dailyFreeRemaining ?? 0 }} из
              {{ quota?.dailyFreeLimit ?? 3 }}
            </p>
            <p class="text-sm text-gray-600 mt-3">
              Обновляется в 00:00
            </p>
          </div>
        </div>
      </div>

      <!-- Purchased Downloads Card -->
      <div class="bg-gray-50 rounded-2xl p-6">
        <div class="flex items-start gap-4">
          <UIcon name="i-lucide-package" class="w-7 h-7 text-gray-500 mt-1" />
          <div>
            <p
              class="text-xs font-medium tracking-widest text-gray-500 uppercase"
            >
              Купленные пакеты
            </p>
            <p class="text-xl font-bold mt-2">
              Скачивания: {{ quota?.paidDownloadsRemaining ?? 0 }}
            </p>
            <p class="text-sm text-gray-600 mt-3">
              Доступны бессрочно
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Notice -->
    <div class="flex items-start gap-3 p-4 bg-blue-50 rounded-xl mb-8">
      <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-500 mt-0.5" />
      <p class="text-sm text-gray-700">
        Если у вас уже есть активная подписка и купленные пакеты, сначала
        расходуется 3 ежедневных бесплатных скачивания
      </p>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap gap-4">
      <NuxtLink
        to="/profile/subscription"
        class="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors"
      >
        {{ hasActiveSubscription ? 'Продлить подписку' : 'Оформить подписку' }}
      </NuxtLink>
      <NuxtLink
        to="/subscriptions"
        class="px-6 py-3 bg-gray-100 text-gray-700 font-bold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-colors"
      >
        Купить пакеты
      </NuxtLink>
    </div>
  </template>
</template>
