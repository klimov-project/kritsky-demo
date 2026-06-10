<script setup lang="ts">
const {
  isAuthenticated,
  toggleMobileMenu,
  isIndexPage,
  handleLogin,
} = useLayout();
</script>

<template>
  <header class="relative z-40">
    <div
      :class="[
        'mx-0 w-full px-4 lg:px-8 pt-[14px] flex items-center',
        isIndexPage ? 'min-h-[86px]' : 'min-h-[100px] py-[13.5px] bg-white',
      ]"
    >
      <NuxtLink to="/" class="inline-flex w-[179px] h-[43px] flex-shrink-0">
        <img
          src="/logo.svg"
          alt="ЕГЭ / КРИЦКИЙ"
          width="179"
          height="43"
          class="w-full h-full"
        />
      </NuxtLink>

      <!-- Desktop Nav -->
      <nav
        class="absolute left-1/2 -translate-x-1/2 hidden lg:inline-flex items-center gap-[50px] whitespace-nowrap"
      >
        <NuxtLink
          to="/create-variant"
          class="nav-link-animated text-[#333] font-serif text-[18px] uppercase"
        >
          Конструктор
        </NuxtLink>
        <NuxtLink
          to="/author-variant"
          class="nav-link-animated text-[#333] font-serif text-[18px] uppercase"
        >
          Вариант недели
        </NuxtLink>
      </nav>

      <!-- Desktop Actions -->
      <div class="ml-auto hidden lg:inline-flex items-center gap-[15px]">
        <template v-if="isAuthenticated">
          <NuxtLink
            to="/profile/my-variants"
            class="text-default hover:opacity-70 transition-opacity size-[24px]"
          >
            <span class="sr-only"> Мои варианты </span>
            <UIcon name="i-lucide-layers" class="size-full" />
          </NuxtLink>
          <NuxtLink
            to="/profile"
            class="text-default hover:opacity-70 transition-opacity size-[24px]"
          >
            <span class="sr-only"> Профиль </span>
            <UIcon name="i-lucide-circle-user-round" class="size-full" />
          </NuxtLink>
        </template>
        <template v-else>
          <button
            @click="handleLogin"
            class="text-[#333] hover:opacity-70 transition-opacity"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </button>
        </template>
      </div>

      <!-- Mobile Actions Toggle -->
      <div class="ml-auto flex lg:hidden items-center gap-[12px]">
        <!-- <NuxtLink to="/subscriptions" class="text-[#333]">
          <IconShoppingBag />
        </NuxtLink> -->
        <button
          @click="toggleMobileMenu"
          class="ml-auto flex items-center text-[#333]"
        >
          <IconMenu />
        </button>
      </div>
    </div>
  </header>
</template>
