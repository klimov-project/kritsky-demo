<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'profile',
});

const { checkPaymentsList } = usePayment();

interface Payment {
  id: number;
  createdAt: string;
  paymentId: string;
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  type: 'subscription' | 'package';
}

const payments = ref<Payment[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch payment history on mount
onMounted(async () => {
  try {
    // Try to fetch from API first
    const response = await checkPaymentsList();

    if (response?.items) {
      payments.value = response.items;
    } else {
      // Use mock data if API not available
      payments.value = [
        {
          id: 1,
          createdAt: '2026-05-14T10:30:00Z',
          paymentId: '31a1a746-000f-5000-b000-19cc5eb014ec',
          amount: 299,
          description: 'Месячная подписка Pro',
          status: 'completed',
          type: 'subscription',
        },
        {
          id: 2,
          createdAt: '2026-04-14T14:15:00Z',
          paymentId: '31a1a746-000f-5000-b000-19cc5eb014ec',
          amount: 299,
          description: 'Месячная подписка Pro',
          status: 'completed',
          type: 'subscription',
        },
        {
          id: 3,
          createdAt: '2026-03-20T09:45:00Z',
          paymentId: '31a1a746-000f-5000-b000-19cc5eb014ec',
          amount: 99,
          description: 'Пакет скачиваний (10 шт)',
          status: 'completed',
          type: 'package',
        },
        {
          id: 4,
          createdAt: '2026-03-14T16:20:00Z',
          paymentId: '31a1a746-000f-5000-b000-19cc5eb014ec',
          amount: 299,
          description: 'Месячная подписка Pro',
          status: 'completed',
          type: 'subscription',
        },
        {
          id: 5,
          createdAt: '2026-02-28T11:00:00Z',
          paymentId: '31a1a746-000f-5000-b000-19cc5eb014ec',
          amount: 199,
          description: 'Пакет скачиваний (25 шт)',
          status: 'failed',
          type: 'package',
        },
      ];
    }
  } catch (err) {
    console.error('Failed to fetch payment history:', err);
    error.value = 'Не удалось загрузить историю платежей';
  } finally {
    isLoading.value = false;
  }
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
};

const getStatusLabel = (status: Payment['status']) => {
  const labels = {
    completed: 'Выполнен',
    pending: 'В обработке',
    failed: 'Ошибка',
  };
  return labels[status];
};

const getStatusColor = (status: Payment['status']) => {
  const colors = {
    completed: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  };
  return colors[status];
};

const getTypeIcon = (type: Payment['type']) => {
  return type === 'subscription' ? 'i-lucide-crown' : 'i-lucide-package';
};
</script>

<template>
  <!-- Header -->
  <div class="border-b border-gray-200 mb-8 pb-4">
    <h1 class="text-2xl font-bold">История оплат</h1>
    <p class="text-gray-500 mt-1">Здесь собрана история вашей оплаты</p>
  </div>

  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center py-12">
    <UIcon
      name="i-lucide-loader-2"
      class="w-8 h-8 text-gray-400 animate-spin"
    />
  </div>

  <!-- Error State -->
  <div
    v-else-if="error"
    class="flex flex-col items-center justify-center py-12 text-center"
  >
    <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-red-400 mb-4" />
    <p class="text-gray-600">{{ error }}</p>
  </div>

  <template v-else>
    <!-- Empty State -->
    <div
      v-if="payments.length === 0"
      class="flex flex-col items-center justify-center py-12 text-center"
    >
      <UIcon name="i-lucide-receipt" class="w-16 h-16 text-gray-300 mb-4" />
      <h3 class="text-lg font-medium text-gray-700 mb-2">
        История платежей пуста
      </h3>
      <p class="text-gray-500 mb-6 max-w-md">
        Здесь будут отображаться все ваши транзакции
      </p>
      <NuxtLink
        to="/profile/subscription"
        class="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
      >
        Оформить подписку
      </NuxtLink>
    </div>

    <!-- Payments List -->
    <div v-else class="space-y-4">
      <div
        v-for="payment in payments"
        :key="payment.paymentId"
        class="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <!-- <pre>
    payment: {{payment}}
      </pre> -->

        <!-- 31a25321-000f-5000-b000-123a06678dd8 -->
        <NuxtLink :to="`/profile/payment?id=${payment.paymentId}`">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-full bg-white flex items-center justify-center"
            >
              <UIcon
                :name="getTypeIcon(payment.type)"
                class="w-6 h-6 text-gray-600"
              />
            </div>
            <div>
              <p class="font-medium">{{ payment.description }}</p>
              <p class="text-sm text-gray-500">
                {{ formatDate(payment.createdAt) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span
              class="px-2.5 py-1 text-xs font-medium rounded-full"
              :class="getStatusColor(payment.status)"
            >
              {{ getStatusLabel(payment.status) }}
            </span>
            <span
              class="font-bold"
              :class="
                payment.status === 'failed'
                  ? 'text-gray-400 line-through'
                  : 'text-gray-900'
              "
            >
              {{ formatAmount(payment.amount) }}
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Pagination placeholder -->
    <div v-if="payments.length > 0" class="mt-6 flex justify-center">
      <p class="text-sm text-gray-500">
        Показано {{ payments.length }} платежей
      </p>
    </div>
  </template>
</template>
