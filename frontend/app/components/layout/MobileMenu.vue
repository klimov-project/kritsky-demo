<script setup lang="ts">
const {
  showMobileMenu,
  isAuthenticated,
  handleLogout,
  handleLogin,
  toggleMobileMenu,
} = useLayout();
</script>

<template>
  <div
    v-if="showMobileMenu"
    class="fixed inset-0 bg-white z-[110] overflow-y-auto p-[10px_20px_26px]"
  >
    <div class="flex items-center justify-between">
      <NuxtLink to="/" class="w-[186px] h-[45px]">
        <img src="/logo.svg" alt="Logo" class="w-full h-full" />
      </NuxtLink>
      <button @click="toggleMobileMenu" class="text-[#333]">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
    <h2 class="text-center font-serif text-[28px] mt-[18px]">Меню</h2>
    <nav class="mt-[24px] flex flex-col gap-[8px]">
      <NuxtLink
        to="/create-variant"
        class="w-full min-h-[58px] rounded-[10px] bg-[#f6f6f6] text-[#333] font-serif text-[18px] uppercase flex items-center px-[24px]"
      >
        Конструктор
      </NuxtLink>
      <NuxtLink
        to="/author-variant"
        class="w-full min-h-[58px] rounded-[10px] bg-[#f6f6f6] text-[#333] font-serif text-[18px] uppercase flex items-center px-[24px]"
      >
        Вариант недели
      </NuxtLink>
    </nav>
    <div class="mt-[60px] flex flex-col gap-[5px]">
      <template v-if="isAuthenticated">
        <NuxtLink
          to="/profile/my-variants"
          class="w-full min-h-[56px] border border-[#cfcfcf] rounded-[10px] text-[#333] font-serif text-[13px] uppercase flex items-center justify-center gap-[10px]"
        >
          Мои варианты
        </NuxtLink>
        <NuxtLink
          to="/profile"
          class="w-full min-h-[56px] border border-[#cfcfcf] rounded-[10px] text-[#333] font-serif text-[13px] uppercase flex items-center justify-center gap-[10px]"
        >
          Мой профиль
        </NuxtLink>
        <button
          @click="handleLogout"
          class="w-full min-h-[56px] border border-[#cfcfcf] rounded-[10px] text-[#333] font-serif text-[13px] uppercase flex items-center justify-center gap-[10px]"
        >
          Выйти
        </button>
      </template>
      <template v-else>
        <button
          @click="handleLogin"
          class="w-full min-h-[56px] border border-[#cfcfcf] rounded-[10px] text-[#333] font-serif text-[13px] uppercase flex items-center justify-center gap-[10px]"
        >
          Войти
        </button>
      </template>
      <button
        class="w-full min-h-[56px] border border-[#cfcfcf] rounded-[10px] text-[#333] font-serif text-[13px] uppercase flex items-center justify-center gap-[10px]"
      >
        Обратная связь
      </button>
    </div>
  </div>
</template>
