<script setup lang="ts">
/**
 * Profile page sidebar navigation
 */
defineProps<{
  activeItem?: string;
}>();

const route = useRoute();

const menuItems = [
  {
    id: 'subscription',
    label: 'Подписка',
    icon: 'i-lucide-user',
    to: '/profile/subscription',
  },
  {
    id: 'profile',
    label: 'Личные данные',
    icon: 'i-lucide-layers',
    to: '/profile',
  },
  {
    id: 'payment-history',
    label: 'История оплаты',
    icon: 'i-lucide-sparkles',
    to: '/profile/payment-history',
  },
];

const userStore = useUserStore();
const {
  user,
  subscriptionExpiryFormatted,
  hasActiveSubscription,
} = storeToRefs(userStore);

const isActive = (item: typeof menuItems[0]) => {
  return route.path === item.to;
};
</script>

<template>
  <aside
    class="w-full lg:w-[270px] flex-shrink-0 flex justify-center aligin-center"
  >
    <div class="flex flex-col gap-5 w-full flex pt-[35%] aligin-center">
      <nav
        class="bg-white rounded-[10px] px-3 py-1 lg:px-6 lg:py-4 flex flex-col"
      >
        <NuxtLink
          v-for="item in menuItems"
          :key="item.id"
          :to="item.to"
          class="flex items-center gap-3 rounded px-5 py-2 transition-colors"
          :class="{
            'bg-gray-100 font-medium': isActive(item),
            'hover:bg-gray-50': !isActive(item),
          }"
        >
          <!-- <UIcon :name="item.icon" class="w-5 h-5 text-gray-600" /> -->
          <span class="text-base">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Subscription Status Block -->
      <div
        v-if="user"
        class="bg-white rounded-[10px] p-5 lg:p-6"
        :class="hasActiveSubscription ? 'bg-emerald-50' : 'bg-gray-50'"
      >
        <div class="flex items-center gap-3">
          <UIcon
            :name="hasActiveSubscription ? 'i-lucide-crown' : 'i-lucide-lock'"
            class="w-6 h-6"
            :class="
              hasActiveSubscription ? 'text-emerald-600' : 'text-gray-500'
            "
          />
          <div>
            <p class="text-sm text-gray-600">
              {{ hasActiveSubscription ? 'Подписка активна' : 'Нет подписки' }}
            </p>
            <p
              v-if="hasActiveSubscription && subscriptionExpiryFormatted"
              class="font-bold text-lg"
            >
              до {{ subscriptionExpiryFormatted }}
            </p>
            <NuxtLink
              v-else
              to="/profile/subscription"
              class="text-sm text-blue-600 hover:underline"
            >
              Оформить подписку
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Feedback Link -->
      <button
        class="bg-white rounded-[10px] p-5 lg:p-6 transition-all text-center"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-message-square" class="w-5 h-5 text-gray-600" />
          <span
            class="font-medium tracking-wider text-sm uppercase text-gray-700"
          >
            Обратная связь
          </span>
        </div>
      </button>
    </div>
  </aside>
</template>
