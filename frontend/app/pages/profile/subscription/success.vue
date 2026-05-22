<script setup lang="ts">
/**
 * Payment success page
 * Handles payment status verification and subscription activation
 */
definePageMeta({
  layout: 'default',
});

const route = useRoute();
const router = useRouter();
const toast = useToast();

const {
  activateSubscription,
  pollPaymentStatus,
  checkPaymentsList,
} = usePayment();

const isActivating = ref(false);
const paymentStatus = ref<
  'pending' | 'succeeded' | 'canceled' | 'rejected' | null
>(null);
const error = ref<string | null>(null);
const subscriptionInfo = ref<{
  type: 'monthly' | 'semiAnnual' | null;
  expiresAt: string | null;
  downloadsPerDay: number;
  unlimitedGenerations: boolean;
} | null>(null);

// Get paymentId from URL params or fetch from payments list
const paymentId = computed(async () => {
  const urlPaymentId = route.query.id as string;
  if (urlPaymentId) return urlPaymentId;

  const response = await checkPaymentsList();
  // Сортируем items по id (по возрастанию)
  const sortedItems = [...(response?.items || [])].sort((a, b) => {
    const idA = typeof a.id === 'number' ? a.id : parseInt(a.id);
    const idB = typeof b.id === 'number' ? b.id : parseInt(b.id);
    return idA - idB;
  });

  const payments = sortedItems.length > 0 ? sortedItems : [];

  // Find the latest completed payment (по createdAt)
  const completedPayments = payments.filter((p) => p.status === 'succeeded');

  console.log(
    '[paymentId] Completed payments count:',
    completedPayments.length,
  );
  console.log(
    '[paymentId] Completed payments:',
    JSON.stringify(completedPayments, null, 2),
  );

  const latestPayment = completedPayments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  console.log('[paymentId] Latest payment:', latestPayment);
  console.log(
    '[paymentId] Returning paymentId:',
    latestPayment?.paymentId || null,
  );

  return latestPayment?.paymentId || null;
});

// Calculate subscription expiration date
const calculateExpirationDate = (
  amount: string | number,
): { type: 'monthly' | 'semiAnnual'; expiresAt: string } => {
  const amountStr = String(amount);
  const now = new Date();

  if (amountStr.startsWith('4144.')) {
    // 6 months subscription
    now.setMonth(now.getMonth() + 6);
    return {
      type: 'semiAnnual',
      expiresAt: now.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  } else if (amountStr.startsWith('890.')) {
    // 1 month subscription
    now.setMonth(now.getMonth() + 1);
    return {
      type: 'monthly',
      expiresAt: now.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  } else {
    // Default: 1 month (fallback)
    now.setMonth(now.getMonth() + 1);
    return {
      type: 'monthly',
      expiresAt: now.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  }
};

// Check payment status on mount
onMounted(async () => {
  const id = await paymentId.value;
  if (!id) {
    error.value = 'Информация о платеже не найдена';
    return;
  }

  // Poll payment status
  pollPaymentStatus(
    id,
    {
      onPending: (status) => {
        paymentStatus.value = status.status;
      },
      onSuccess: async (status) => {
        paymentStatus.value = status.status;

        // Get payment details to determine subscription type
        const paymentsResponse = await checkPaymentsList();
        const payments = paymentsResponse?.items || [];
        const currentPayment = payments.find((p) => p.paymentId === id);

        if (currentPayment) {
          const { type, expiresAt } = calculateExpirationDate(
            currentPayment.amount,
          );
          subscriptionInfo.value = {
            type,
            expiresAt,
            downloadsPerDay: 3,
            unlimitedGenerations: true,
          };
        }

        // Activate subscription
        isActivating.value = true;
        const activated = await activateSubscription();
        isActivating.value = false;

        if (activated) {
          toast.add({
            title: 'Оплата прошла успешно',
            description: 'Подписка активирована! Спасибо за покупку.',
            color: 'success',
            icon: 'i-lucide-circle-check',
          });

          // Redirect to subscription page after 3 seconds
          setTimeout(() => {
            router.push('/profile/subscription');
          }, 10000);
        }
      },
      onFailed: (status) => {
        paymentStatus.value = status?.status || 'rejected';
        error.value = 'Оплата не прошла. Пожалуйста, попробуйте снова.';

        toast.add({
          title: 'Ошибка оплаты',
          description: error.value,
          color: 'error',
          icon: 'i-lucide-alert-circle',
        });
      },
    },
    3000,
    30,
  );
});

const goBack = () => {
  router.push('/profile/subscription');
};
</script>

<template>
  <div class="min-h-screen py-12">
    <div class="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
      <!-- Loading State -->
      <div v-if="!paymentStatus && !error" class="text-center">
        <UIcon
          name="i-lucide-loader-2"
          class="w-16 h-16 animate-spin text-gray-400 mx-auto mb-4"
        />
        <h2 class="text-xl font-semibold mb-2">Проверка платежа</h2>
        <p class="text-gray-500">Пожалуйста, подождите...</p>
      </div>

      <!-- Pending State -->
      <div v-else-if="paymentStatus === 'pending'" class="text-center">
        <UIcon
          name="i-lucide-clock"
          class="w-16 h-16 text-yellow-500 mx-auto mb-4"
        />
        <h2 class="text-xl font-semibold mb-2">Ожидание оплаты</h2>
        <p class="text-gray-500 mb-4">
          Мы проверяем статус вашего платежа...
        </p>
        <UButton @click="goBack" color="gray">Вернуться к подписке</UButton>
      </div>

      <!-- Success State -->
      <div v-else-if="paymentStatus === 'succeeded'" class="text-center">
        <UIcon
          name="i-lucide-circle-check"
          class="w-16 h-16 text-emerald-500 mx-auto mb-4"
        />
        <h2 class="text-xl font-semibold mb-2">Оплата прошла успешно!</h2>

        <div v-if="subscriptionInfo" class="mb-6 text-left space-y-2">
          <p class="text-gray-600">
            Вы купили подписку на
            <span class="font-semibold">
              {{
                subscriptionInfo.type === 'semiAnnual' ? '6 месяцев' : '1 месяц'
              }} </span
            >.
          </p>
          <p class="text-gray-600">
            Она истекает
            <span class="font-semibold">{{ subscriptionInfo.expiresAt }}</span
            >.
          </p>
          <p class="text-gray-600">
            До этого момента вам доступны:
          </p>
          <ul class="list-disc list-inside text-gray-600 pl-4">
            <li>Безлимитные генерации вариантов;</li>
            <li>
              {{ subscriptionInfo.downloadsPerDay }} бесплатных скачивания в
              день.
            </li>
          </ul>
        </div>

        <p class="text-gray-500 mb-4" v-else>
          Подписка активирована. Спасибо за покупку!
        </p>

        <div class="flex gap-3 justify-center">
          <UButton @click="goBack" color="gray">Вернуться к подписке</UButton>
          <NuxtLink
            to="/create-variant"
            class="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Создать свой вариант
          </NuxtLink>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="
          error || paymentStatus === 'canceled' || paymentStatus === 'rejected'
        "
        class="text-center"
      >
        <UIcon
          name="i-lucide-circle-x"
          class="w-16 h-16 text-red-500 mx-auto mb-4"
        />
        <h2 class="text-xl font-semibold mb-2">Ошибка оплаты</h2>
        <p class="text-gray-500 mb-4">
          {{ error || 'Платеж не был завершен. Пожалуйста, попробуйте снова.' }}
        </p>
        <UButton @click="goBack" color="black">Вернуться к подписке</UButton>
      </div>
    </div>
  </div>
</template>
