<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

// Mock packs data
const packs = ref([
  {
    id: '1',
    name: 'Пакет 10 скачиваний',
    price: 199,
    downloads: 10,
    description: 'Дополнительные скачивания для вашего аккаунта',
  },
  {
    id: '2',
    name: 'Пакет 30 скачиваний',
    price: 499,
    downloads: 30,
    description: 'Выгодный пакет для активной работы',
  },
  {
    id: '3',
    name: 'Пакет 100 скачиваний',
    price: 1499,
    downloads: 100,
    description: 'Максимальный пакет для преподавателей',
  },
]);

const remainingDownloads = ref(3);
const isPurchasing = ref(false);

const purchasePack = async (pack: any) => {
  isPurchasing.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Purchased pack:', pack);
    remainingDownloads.value += pack.downloads;
  } finally {
    isPurchasing.value = false;
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
            to="/profile"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← К профилю
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">Пакеты скачиваний</h1>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Current Balance -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Доступно скачиваний</p>
            <p class="text-4xl font-bold text-blue-600">
              {{ remainingDownloads }}
            </p>
          </div>
          <span class="text-5xl">📥</span>
        </div>
      </div>

      <!-- Packs Grid -->
      <h2 class="text-xl font-bold text-gray-900 mb-4">Купить пакет</h2>

      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-for="pack in packs"
          :key="pack.id"
          class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 class="text-lg font-bold text-gray-900 mb-2">{{ pack.name }}</h3>
          <p class="text-sm text-gray-600 mb-4">{{ pack.description }}</p>

          <div class="mb-4">
            <span class="text-3xl font-bold text-blue-600"
              >{{ pack.price }} ₽</span
            >
          </div>

          <div class="text-sm text-gray-500 mb-4">
            <span class="font-medium text-gray-900">{{ pack.downloads }}</span>
            скачиваний
          </div>

          <button
            @click="purchasePack(pack)"
            :disabled="isPurchasing"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition"
          >
            {{ isPurchasing ? 'Покупка...' : 'Купить' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
