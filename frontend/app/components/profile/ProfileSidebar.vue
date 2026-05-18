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
    id: 'profile',
    label: 'Мой профиль',
    icon: 'i-lucide-user',
    to: '/profile',
  },
  {
    id: 'my-variants',
    label: 'Мои варианты',
    icon: 'i-lucide-layers',
    to: '/profile/my-variants',
  },
  {
    id: 'subscription',
    label: 'Подписка',
    icon: 'i-lucide-sparkles',
    to: '/profile/subscription',
  },
  {
    id: 'payment-history',
    label: 'История оплат',
    icon: 'i-lucide-credit-card',
    to: '/profile/payment-history',
  },
];

const userStore = useUserStore();
const { user, subscriptionExpiryFormatted, hasActiveSubscription } =
  storeToRefs(userStore);

const isActive = (item: (typeof menuItems)[0]) => {
  return route.path === item.to;
};
</script>

<template>
  <aside class="w-full lg:w-[270px] flex-shrink-0">
    <!-- Navigation Menu -->
    <nav class="space-y-1">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.id"
        :to="item.to"
        class="flex items-center gap-3 rounded-xl px-5 py-3.5 transition-colors"
        :class="{
          'bg-gray-100 font-medium': isActive(item),
          'hover:bg-gray-50': !isActive(item),
        }"
      >
        <UIcon :name="item.icon" class="w-5 h-5 text-gray-600" />
        <span class="text-[15px]">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Subscription Status Block -->
    <div
      v-if="user"
      class="mt-6 rounded-2xl p-5"
      :class="hasActiveSubscription ? 'bg-emerald-50' : 'bg-gray-50'"
    >
      <div class="flex items-center gap-3">
        <UIcon
          :name="hasActiveSubscription ? 'i-lucide-crown' : 'i-lucide-lock'"
          class="w-6 h-6"
          :class="hasActiveSubscription ? 'text-emerald-600' : 'text-gray-500'"
        />
        <div>
          <p class="text-sm text-gray-600">
            {{ hasActiveSubscription ? 'Подписка активна' : 'Нет подписки' }}
          </p>
          <p v-if="hasActiveSubscription && subscriptionExpiryFormatted" class="font-bold text-lg">
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
      class="mt-5 w-full flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <UIcon name="i-lucide-message-square" class="w-5 h-5 text-gray-600" />
      <span class="font-medium tracking-wider text-sm uppercase"
        >Обратная связь</span
      >
    </button>
  </aside>
</template>
