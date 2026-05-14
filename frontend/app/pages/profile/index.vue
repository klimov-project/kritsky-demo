<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default',
});

const { session, updateProfile, changePassword, logout, isLoading } = useAuth();

// State
const isEditing = ref(false);
const editName = ref(session.value?.user?.name || '');
const editEmail = ref(session.value?.user?.email || '');
const editPhone = ref(session.value?.user?.phone || '');
const isSaving = ref(false);
const successMessage = ref('');

// Watchers
watch(
  () => session.value?.user,
  (user) => {
    if (user) {
      editName.value = user.name || '';
      editEmail.value = user.email || '';
      editPhone.value = user.phone || '';
    }
  },
);

const handleSave = async () => {
  isSaving.value = true;
  try {
    await updateProfile({
      name: editName.value,
      email: editEmail.value,
      phone: editPhone.value,
    });
    isEditing.value = false;
    successMessage.value = 'Профиль успешно обновлён';
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error('Profile update error:', error);
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  editName.value = session.value?.user?.name || '';
  editEmail.value = session.value?.user?.email || '';
  editPhone.value = session.value?.user?.phone || '';
  isEditing.value = false;
};

const handleLogout = async () => {
  try {
    await logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← На главную
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">Профиль</h1>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Success Message -->
      <div
        v-if="successMessage"
        class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
      >
        {{ successMessage }}
      </div>

      <!-- Profile Card -->
      <div class="bg-white rounded-lg shadow p-8 mb-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">
          Информация о профиле
        </h2>

        <div v-if="!isEditing && session?.user" class="space-y-4">
          <div>
            <label class="text-sm text-gray-500 uppercase tracking-wider"
              >Имя</label
            >
            <p class="text-lg font-medium text-gray-900">
              {{ session.user.name || 'Не указано' }}
            </p>
          </div>
          <div>
            <label class="text-sm text-gray-500 uppercase tracking-wider"
              >Email</label
            >
            <p class="text-lg font-medium text-gray-900">
              {{ session.user.email }}
            </p>
          </div>
          <div>
            <label class="text-sm text-gray-500 uppercase tracking-wider"
              >Телефон</label
            >
            <p class="text-lg font-medium text-gray-900">
              {{ session.user.phone || 'Не указан' }}
            </p>
          </div>
          <div>
            <label class="text-sm text-gray-500 uppercase tracking-wider"
              >Статус</label
            >
            <p class="text-lg font-medium">
              <span v-if="session.user.isPro" class="text-green-600"
                >🔒 Премиум подписка</span
              >
              <span v-else class="text-gray-600">Бесплатная версия</span>
            </p>
          </div>

          <button
            @click="isEditing = true"
            class="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Редактировать профиль
          </button>
        </div>

        <div v-else class="space-y-4">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 uppercase tracking-wider mb-2"
            >
              Имя
            </label>
            <input
              v-model="editName"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 uppercase tracking-wider mb-2"
            >
              Email
            </label>
            <input
              v-model="editEmail"
              type="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 uppercase tracking-wider mb-2"
            >
              Телефон
            </label>
            <input
              v-model="editPhone"
              type="tel"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="flex gap-3 mt-6">
            <button
              @click="handleSave"
              :disabled="isSaving || isLoading"
              class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
            </button>
            <button
              @click="handleCancel"
              class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Отменить
            </button>
          </div>
        </div>
      </div>

      <!-- Action Cards -->
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-bold text-lg mb-2">🔐 Безопасность</h3>
          <p class="text-gray-600 text-sm mb-4">
            Измените пароль и параметры безопасности
          </p>
          <button class="text-blue-600 hover:text-blue-700 font-medium">
            Изменить пароль →
          </button>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-bold text-lg mb-2">🎁 Подписка</h3>
          <p class="text-gray-600 text-sm mb-4">
            Управляйте подпиской на премиум функции
          </p>
          <NuxtLink
            to="/shop"
            class="text-blue-600 hover:text-blue-700 font-medium"
            >Посмотреть план →</NuxtLink
          >
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-bold text-lg mb-2">💾 Данные</h3>
          <p class="text-gray-600 text-sm mb-4">
            Скачайте или удалите ваши данные
          </p>
          <button class="text-blue-600 hover:text-blue-700 font-medium">
            Управление данными →
          </button>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-bold text-lg mb-2">🚪 Выход</h3>
          <p class="text-gray-600 text-sm mb-4">
            Выйти из аккаунта на всех устройствах
          </p>
          <button
            @click="handleLogout"
            :disabled="isLoading"
            class="text-red-600 hover:text-red-700 font-medium disabled:text-gray-400"
          >
            {{ isLoading ? 'Загрузка...' : 'Выйти →' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
