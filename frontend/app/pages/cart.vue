<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

const router = useRouter();
const auth = useAuth();
const { session, isAuthenticated } = auth;

// Mock cart items
const cartItems = ref([
  {
    id: 1,
    name: 'Месячная подписка',
    price: 99,
    quantity: 1,
    type: 'subscription',
  },
]);

const isSubmitting = ref(false);
const error = ref('');
const successMessage = ref('');

// Delivery info (for physical items)
const deliveryType = ref('pickup');
const deliveryAddress = ref('');
const recipientName = ref('');
const recipientPhone = ref('');

// Computed
const hasPhysicalItems = computed(() => {
  return cartItems.value.some(
    (item) => item.type === 'book' || item.type === 'physical',
  );
});

const subtotal = computed(() => {
  return cartItems.value.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
});

const deliveryAmount = computed(() => {
  if (!hasPhysicalItems.value) return 0;
  return deliveryType.value === 'delivery' ? 300 : 0;
});

const totalAmount = computed(() => {
  return subtotal.value + deliveryAmount.value;
});

const isEmpty = computed(() => cartItems.value.length === 0);

// Methods
const changeQuantity = (itemId: number, delta: number) => {
  const item = cartItems.value.find((i) => i.id === itemId);
  if (item) {
    item.quantity = Math.max(1, item.quantity + delta);
  }
};

const removeItem = (itemId: number) => {
  cartItems.value = cartItems.value.filter((i) => i.id !== itemId);
};

const handleCheckout = async () => {
  isSubmitting.value = true;
  error.value = '';

  try {
    // Simulate checkout
    await new Promise((resolve) => setTimeout(resolve, 1000));
    successMessage.value =
      'Заказ успешно оформлен! Перенаправляем на оплату...';
    setTimeout(() => {
      router.push('/profile');
    }, 2000);
  } catch (e) {
    error.value = 'Ошибка при оформлении заказа. Попробуйте снова.';
  } finally {
    isSubmitting.value = false;
  }
};

const goToShop = () => {
  router.push('/shop');
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
          <h1 class="text-2xl font-bold text-gray-900">Корзина</h1>
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

      <!-- Error Message -->
      <div
        v-if="error"
        class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
      >
        {{ error }}
      </div>

      <!-- Empty Cart -->
      <div v-if="isEmpty" class="text-center py-20">
        <div class="text-6xl mb-4">🛒</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Корзина пуста</h2>
        <p class="text-gray-600 mb-6">Добавьте товары для оформления заказа</p>
        <button
          @click="goToShop"
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Перейти к тарифам
        </button>
      </div>

      <!-- Cart Content -->
      <div v-else class="grid md:grid-cols-3 gap-8">
        <!-- Cart Items -->
        <div class="md:col-span-2 space-y-4">
          <div
            v-for="item in cartItems"
            :key="item.id"
            class="bg-white rounded-lg shadow p-6"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-gray-900">{{ item.name }}</h3>
                <p class="text-sm text-gray-500">
                  {{ item.type === 'subscription' ? 'Подписка' : 'Товар' }}
                </p>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <button
                    @click="changeQuantity(item.id, -1)"
                    class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span class="w-8 text-center">{{ item.quantity }}</span>
                  <button
                    @click="changeQuantity(item.id, 1)"
                    class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <span class="font-bold text-lg"
                  >{{ item.price * item.quantity }} ₽</span
                >
                <button
                  @click="removeItem(item.id)"
                  class="text-red-500 hover:text-red-600 text-sm"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>

          <!-- Delivery Options (for physical items) -->
          <div v-if="hasPhysicalItems" class="bg-white rounded-lg shadow p-6">
            <h3 class="font-bold text-gray-900 mb-4">Способ доставки</h3>
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="deliveryType"
                  type="radio"
                  value="pickup"
                  class="w-4 h-4"
                />
                <span>Самовывоз (бесплатно)</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="deliveryType"
                  type="radio"
                  value="delivery"
                  class="w-4 h-4"
                />
                <span>Доставка (+300 ₽)</span>
              </label>
            </div>

            <div v-if="deliveryType === 'delivery'" class="mt-4 space-y-3">
              <input
                v-model="deliveryAddress"
                type="text"
                placeholder="Адрес доставки"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                v-model="recipientName"
                type="text"
                placeholder="ФИО получателя"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                v-model="recipientPhone"
                type="tel"
                placeholder="Телефон получателя"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="md:col-span-1">
          <div class="bg-white rounded-lg shadow p-6 sticky top-20">
            <h3 class="font-bold text-gray-900 mb-4">Итого</h3>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Подытог</span>
                <span>{{ subtotal }} ₽</span>
              </div>
              <div v-if="hasPhysicalItems" class="flex justify-between">
                <span class="text-gray-600">Доставка</span>
                <span>{{ deliveryAmount }} ₽</span>
              </div>
              <div class="border-t pt-2 mt-2">
                <div class="flex justify-between font-bold text-lg">
                  <span>К оплате</span>
                  <span>{{ totalAmount }} ₽</span>
                </div>
              </div>
            </div>

            <button
              @click="handleCheckout"
              :disabled="isSubmitting"
              class="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition"
            >
              {{ isSubmitting ? 'Оформление...' : 'Оформить заказ' }}
            </button>

            <p class="text-xs text-gray-500 text-center mt-4">
              Нажимая кнопку, вы соглашаетесь с
              <NuxtLink to="/terms" class="text-blue-600 hover:underline"
                >условиями оферты</NuxtLink
              >
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
