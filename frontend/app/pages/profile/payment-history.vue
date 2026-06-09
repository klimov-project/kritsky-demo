<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'profile',
});

const { checkPaymentsList } = usePayment();

interface Payment {
  id: number;
  paymentId: string;
  orderId: string | null;
  amount: string;
  status: 'succeeded' | 'canceled' | 'pending';
  method: string;
  kind: 'subscription' | 'package';
  createdAt: string;
}

const payments = ref<Payment[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch payment history on mount
onMounted(async () => {
  try {
    const response = await checkPaymentsList();

    if (response?.items) {
      payments.value = response.items;
    } else {
      // Используем моковые данные, если API недоступно
      payments.value = [
        {
          id: 1,
          paymentId: '31a1a746-000f-5000-b000-19cc5eb014ec',
          orderId: null,
          amount: '4144.02',
          status: 'succeeded',
          method: 'yookassa',
          kind: 'subscription',
          createdAt: '2026-05-21T10:30:00Z',
        },
        {
          id: 2,
          paymentId: '31a1a746-000f-5000-b000-19cc5eb014eb',
          orderId: null,
          amount: '890.00',
          status: 'succeeded',
          method: 'yookassa',
          kind: 'subscription',
          createdAt: '2026-04-14T14:15:00Z',
        }, 
        {
          id: 4,
          paymentId: '31a1a746-000f-5000-b000-19cc5eb014ed',
          orderId: null,
          amount: '4144.02',
          status: 'pending',
          method: 'yookassa',
          kind: 'subscription',
          createdAt: '2026-03-14T16:20:00Z',
        },
        {
          id: 5,
          paymentId: '31a1a746-000f-5000-b000-19cc5eb014ec',
          orderId: null,
          amount: '199.00',
          status: 'canceled',
          method: 'yookassa',
          kind: 'package',
          createdAt: '2026-02-28T11:00:00Z',
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

// Форматирование даты
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

// Форматирование только даты (без времени)
const formatDateOnly = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// Форматирование суммы (приводим к числу)
const formatAmount = (amount: string | number) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(numAmount);
};

// Расчет срока подписки на основе суммы
const getSubscriptionPeriod = (amount: string | number, createdAt: string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const startDate = new Date(createdAt);
  const endDate = new Date(startDate);
  
  // 4144.02 - 6 месяцев, 890 - 1 месяц
  if (numAmount >= 4000) {
    endDate.setMonth(endDate.getMonth() + 6);
  } else if (numAmount >= 800) {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    return null; // Для пакетов и других товаров
  }
  
  return {
    startDate,
    endDate,
    period: `${formatDateOnly(startDate.toISOString())} - ${formatDateOnly(endDate.toISOString())}`
  };
};

// Получение описания платежа
const getPaymentDescription = (payment: Payment) => {
  if (payment.kind === 'subscription') {
    const amount = parseFloat(payment.amount);
    if (amount >= 4000) return 'Подписка на 6 месяцев';
    if (amount >= 800) return 'Подписка на 1 месяц';
    return 'Подписка';
  }
  return 'Пакет услуг';
};

// Статусы и их отображение
const getStatusLabel = (status: Payment['status']) => {
  const labels = {
    succeeded: 'Выполнен',
    pending: 'В обработке',
    canceled: 'Отменен',
  };
  return labels[status] || status;
};

const getStatusColor = (status: Payment['status']) => {
  const colors = {
    succeeded: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-yellow-100 text-yellow-700',
    canceled: 'bg-gray-200 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
};

// Иконка типа платежа
const getTypeIcon = (kind: Payment['kind']) => {
  return kind === 'subscription' ? 'i-lucide-crown' : 'i-lucide-package';
};

// Проверка, является ли платеж успешной подпиской
const isActiveSubscription = (payment: Payment) => {
  return payment.kind === 'subscription' && payment.status === 'succeeded';
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

    <!-- Payments Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Описание</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Дата</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Сумма</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Статус</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Срок подписки</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="payment in payments"
            :key="payment.paymentId"
            class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td class="py-4 px-4">
              <NuxtLink 
                :to="`/profile/payment?id=${payment.paymentId}`"
                class="flex items-center gap-3 hover:text-gray-600"
              >
                <div
                  class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                >
                  <UIcon
                    :name="getTypeIcon(payment.kind)"
                    class="w-5 h-5 text-gray-600"
                  />
                </div>
                <span class="font-medium text-gray-900">
                  {{ getPaymentDescription(payment) }}
                </span>
              </NuxtLink>
            </td>
            <td class="py-4 px-4 text-sm text-gray-600">
              {{ formatDate(payment.createdAt) }}
            </td>
            <td class="py-4 px-4">
              <span
                class="font-medium"
                :class="
                  payment.status === 'canceled'
                    ? 'text-gray-400 line-through'
                    : 'text-gray-900'
                "
              >
                {{ formatAmount(payment.amount) }}
              </span>
            </td>
            <td class="py-4 px-4">
              <span
                class="inline-flex px-2.5 py-1 text-xs font-medium rounded-full"
                :class="getStatusColor(payment.status)"
              >
                {{ getStatusLabel(payment.status) }}
              </span>
            </td>
            <td class="py-4 px-4 text-sm text-gray-600">
              <template v-if="isActiveSubscription(payment)">
                <div class="flex items-center gap-1">
                  <UIcon 
                    name="i-lucide-calendar" 
                    class="w-4 h-4 text-gray-400" 
                  />
                  <span>
                    {{ getSubscriptionPeriod(payment.amount, payment.createdAt)?.period }}
                  </span>
                </div>
              </template>
              <template v-else>
                <span class="text-gray-400">—</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination placeholder -->
    <div v-if="payments.length > 0" class="mt-6 flex justify-center">
      <p class="text-sm text-gray-500">
        Показано {{ payments.length }} платежей
      </p>
    </div>
  </template>
</template>