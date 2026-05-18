<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const productId = computed(() => route.params.id);

// Mock product data
const product = ref({
  id: productId.value,
  name: 'Месячная подписка',
  price: 99,
  currency: '₽',
  period: 'месяц',
  description:
    'Полный доступ ко всем функциям конструктора вариантов ЕГЭ на один месяц.',
  features: [
    'Неограниченная генерация вариантов',
    'До 3 скачиваний в день',
    'Сохранение вариантов',
    'Приоритетная поддержка',
  ],
});

const isAdding = ref(false);

const handleAddToCart = async () => {
  isAdding.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push('/');
  } finally {
    isAdding.value = false;
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
            to="/shop"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← К тарифам
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900">Детали тарифа</h1>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-8">
          <div class="grid md:grid-cols-2 gap-8">
            <!-- Product Info -->
            <div>
              <h2 class="text-3xl font-bold text-gray-900 mb-4">
                {{ product.name }}
              </h2>
              <p class="text-gray-600 mb-6">{{ product.description }}</p>

              <div class="mb-6">
                <span class="text-4xl font-bold text-blue-600">{{
                  product.price
                }}</span>
                <span class="text-gray-500 ml-1"
                  >{{ product.currency }}/{{ product.period }}</span
                >
              </div>

              <button
                @click="handleAddToCart"
                :disabled="isAdding"
                class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition"
              >
                {{ isAdding ? 'Добавление...' : 'Добавить в корзину' }}
              </button>
            </div>

            <!-- Features -->
            <div class="bg-gray-50 rounded-lg p-6">
              <h3 class="font-bold text-gray-900 mb-4">Что включено:</h3>
              <ul class="space-y-3">
                <li
                  v-for="(feature, idx) in product.features"
                  :key="idx"
                  class="flex items-start gap-3"
                >
                  <span class="text-green-500 font-bold">✓</span>
                  <span class="text-gray-700">{{ feature }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
