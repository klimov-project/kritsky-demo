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
  checkPaymentStatus,
  activateSubscription,
  pollPaymentStatus,
} = usePayment();

const isActivating = ref(false);
const paymentStatus = ref<
  'pending' | 'succeeded' | 'canceled' | 'rejected' | null
>(null);
const error = ref<string | null>(null);

// Get payment_id from URL params
const paymentId = computed(() => route.query.id as string);
console.log('paymentId.value', paymentId.value);

// Check payment status on mount
onMounted(async () => {
  if (!paymentId.value) {
    error.value = 'Информация о платеже не найдена';
    return;
  }

  // Poll payment status
  pollPaymentStatus(
    paymentId.value,
    {
      onPending: (status) => {
        paymentStatus.value = status.status;
        console.log('Payment pending...');
      },
      onSuccess: async (status) => {
        paymentStatus.value = status.status;
        console.log('Payment succeeded!', status);

        // Activate subscription after successful payment
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
  ); // Check every 3 seconds, max 30 attempts (90 seconds)
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
        <p class="text-gray-500 mb-4" v-if="!isActivating">
          Подписка активирована. Спасибо за покупку!
        </p>
        <p class="text-gray-500 mb-4" v-else>
          Активация подписки...
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
