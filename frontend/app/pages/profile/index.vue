<script setup lang="ts">
/**
 * Profile page - displays user info and subscription status
 */
definePageMeta({
  middleware: 'auth',
});

const auth = useAuth();
const { user, logout } = auth;
const userStore = useUserStore();
const { quota, subscriptionExpiryFormatted, hasActiveSubscription } =
  storeToRefs(userStore);

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
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Main Card -->
      <div class="bg-white rounded-3xl p-6 md:p-10 shadow-sm">
        <div class="flex flex-col lg:flex-row gap-10">
          <!-- Sidebar -->
          <ProfileSidebar active-item="profile" />

          <!-- Main Content -->
          <main class="flex-1">
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
                <UIcon
                  name="i-lucide-log-out"
                  class="w-5 h-5"
                />
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
                  :class="
                    hasActiveSubscription ? 'bg-emerald-50' : 'bg-gray-50'
                  "
                >
                  <div class="flex items-start gap-4">
                    <UIcon
                      :name="
                        hasActiveSubscription ? 'i-lucide-crown' : 'i-lucide-lock'
                      "
                      class="w-7 h-7 mt-1"
                      :class="
                        hasActiveSubscription
                          ? 'text-emerald-600'
                          : 'text-gray-500'
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
                    <UIcon
                      name="i-lucide-clock"
                      class="w-7 h-7 text-gray-500 mt-1"
                    />
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
                    <UIcon
                      name="i-lucide-package"
                      class="w-7 h-7 text-gray-500 mt-1"
                    />
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

              <!-- Personal Data Section -->
              <div class="bg-gray-50 rounded-2xl p-6 mb-8">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-lg font-semibold">Личные данные</h2>
                  <button
                    v-if="!isEditing"
                    class="text-sm text-blue-600 hover:underline"
                    @click="startEditing"
                  >
                    Редактировать
                  </button>
                </div>

                <div v-if="!isEditing" class="space-y-4">
                  <div class="flex items-center gap-4">
                    <span class="w-24 text-sm text-gray-500">Имя:</span>
                    <span class="font-medium">{{
                      userStore.user?.name || 'Не указано'
                    }}</span>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="w-24 text-sm text-gray-500">Email:</span>
                    <span class="font-medium">{{
                      userStore.user?.email || 'Не указано'
                    }}</span>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="w-24 text-sm text-gray-500">Телефон:</span>
                    <span class="font-medium">{{
                      userStore.user?.phone || 'Не указано'
                    }}</span>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="w-24 text-sm text-gray-500">Статус:</span>
                    <span
                      class="px-2.5 py-1 text-xs font-medium rounded-full"
                      :class="
                        userStore.user?.isPro
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-200 text-gray-700'
                      "
                    >
                      {{ userStore.user?.isPro ? 'Pro' : 'Free' }}
                    </span>
                  </div>
                </div>

                <!-- Edit Form -->
                <form v-else class="space-y-4" @submit.prevent="saveProfile">
                  <div>
                    <label class="block text-sm text-gray-600 mb-1">Имя</label>
                    <input
                      v-model="editForm.name"
                      type="text"
                      class="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ваше имя"
                    />
                  </div>
                  <div>
                    <label class="block text-sm text-gray-600 mb-1">Email</label>
                    <input
                      v-model="editForm.email"
                      type="email"
                      class="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label class="block text-sm text-gray-600 mb-1"
                      >Телефон</label
                    >
                    <input
                      v-model="editForm.phone"
                      type="tel"
                      class="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div class="flex gap-3 pt-2">
                    <button
                      type="submit"
                      class="px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                      @click="cancelEditing"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>

              <!-- Info Notice -->
              <div
                class="flex items-start gap-3 p-4 bg-blue-50 rounded-xl mb-8"
              >
                <UIcon
                  name="i-lucide-info"
                  class="w-5 h-5 text-blue-500 mt-0.5"
                />
                <p class="text-sm text-gray-700">
                  При активной подписке сначала расходуются бесплатные ежедневные
                  скачивания, затем купленные пакеты
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap gap-4">
                <NuxtLink
                  to="/profile/subscription"
                  class="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {{
                    hasActiveSubscription
                      ? 'Продлить подписку'
                      : 'Оформить подписку'
                  }}
                </NuxtLink>
                <NuxtLink
                  to="/subscriptions"
                  class="px-6 py-3 bg-gray-100 text-gray-700 font-bold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Купить пакеты
                </NuxtLink>
              </div>
            </template>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>
