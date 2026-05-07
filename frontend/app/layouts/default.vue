<script setup lang="ts">
const auth = useAuth();
const { session, isAuthenticated, logout, isLoading: authLoading } = auth;
const showMobileMenu = ref(false);

const handleLogout = async () => {
  try {
    await logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

// Close mobile menu on route change
const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    showMobileMenu.value = false;
  },
);

const isIndexPage = computed(() => route.path === '/');
const isTestPage = computed(
  () => route.path === '/new_test' || route.path === '/author-variant',
);
const hasBackgroundLayer = computed(() => isIndexPage.value);
const hasTransparentShell = computed(
  () => hasBackgroundLayer.value || isTestPage.value,
);
</script>

<template>
  <div
    :class="[
      'min-h-screen bg-[var(--home-color-bg)]',
      { 'relative overflow-hidden': hasBackgroundLayer },
    ]"
  >
    <!-- Background Layer for Home -->
    <div
      v-if="hasBackgroundLayer"
      class="fixed inset-0 bg-center bg-no-repeat opacity-[0.02] pointer-events-none"
      style="background-image: url('/page_bg.svg'); background-size: auto;"
      aria-hidden="true"
    />

    <div
      :class="[
        'w-full min-h-screen flex flex-col relative',
        hasTransparentShell
          ? 'bg-transparent z-10'
          : 'bg-[var(--home-color-bg)]',
      ]"
    >
      <!-- Header -->
      <header class="relative z-40">
        <div
          class="mx-auto max-w-[1440px] w-full px-4 lg:px-8 mt-[30px] flex items-center min-h-[43px]"
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
              to="/new_test"
              class="nav-link-animated font-serif text-[18px] uppercase"
              >Конструктор</NuxtLink
            >
            <NuxtLink
              to="/author-variant"
              class="nav-link-animated font-serif text-[18px] uppercase"
              >Вариант недели</NuxtLink
            >
            <NuxtLink
              to="/shop"
              class="nav-link-animated font-serif text-[18px] uppercase"
              >Магазин</NuxtLink
            >
          </nav>

          <!-- Desktop Actions -->
          <div class="ml-auto hidden lg:inline-flex items-center gap-[15px]">
            <template v-if="isAuthenticated">
              <NuxtLink
                to="/my-variants"
                class="text-[#333] hover:opacity-70 transition-opacity"
                ><span class="sr-only">Мои варианты</span
                ><i class="icon-list"></i
              ></NuxtLink>
              <span class="w-[1px] h-[26px] bg-[#cfcfcf]"></span>
              <NuxtLink
                to="/my-books"
                class="text-[#333] hover:opacity-70 transition-opacity"
                ><span class="sr-only">Мои покупки</span
                ><i class="icon-book"></i
              ></NuxtLink>
              <span class="w-[1px] h-[26px] bg-[#cfcfcf]"></span>
              <NuxtLink
                to="/cart"
                class="text-[#333] hover:opacity-70 transition-opacity"
                ><span class="sr-only">Корзина</span><i class="icon-cart"></i
              ></NuxtLink>
              <span class="w-[1px] h-[26px] bg-[#cfcfcf]"></span>
              <NuxtLink
                to="/saved"
                class="text-[#333] hover:opacity-70 transition-opacity"
                ><span class="sr-only">Избранное</span
                ><i class="icon-bookmark"></i
              ></NuxtLink>
              <span class="w-[1px] h-[26px] bg-[#cfcfcf]"></span>
              <NuxtLink
                to="/profile"
                class="text-[#333] hover:opacity-70 transition-opacity"
                ><span class="sr-only">Профиль</span><i class="icon-profile"></i
              ></NuxtLink>
            </template>
            <template v-else>
              <NuxtLink
                to="/login"
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
              </NuxtLink>
            </template>
          </div>

          <!-- Mobile Actions Toggle -->
          <div class="ml-auto flex lg:hidden items-center gap-[12px]">
            <NuxtLink to="/cart" class="text-[#333]">
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
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </NuxtLink>
            <button @click="toggleMobileMenu" class="text-[#333]">
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
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Mobile Menu Overlay -->
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
            to="/new_test"
            class="w-full min-h-[58px] rounded-[10px] bg-[#f6f6f6] text-[#333] font-serif text-[18px] uppercase flex items-center px-[24px]"
            >Конструктор</NuxtLink
          >
          <NuxtLink
            to="/author-variant"
            class="w-full min-h-[58px] rounded-[10px] bg-[#f6f6f6] text-[#333] font-serif text-[18px] uppercase flex items-center px-[24px]"
            >Вариант недели</NuxtLink
          >
          <NuxtLink
            to="/shop"
            class="w-full min-h-[58px] rounded-[10px] bg-[#f6f6f6] text-[#333] font-serif text-[18px] uppercase flex items-center px-[24px]"
            >Магазин</NuxtLink
          >
        </nav>
        <div class="mt-[60px] flex flex-col gap-[5px]">
          <template v-if="isAuthenticated">
            <NuxtLink
              to="/profile"
              class="w-full min-h-[56px] border border-[#cfcfcf] rounded-[10px] text-[#333] font-serif text-[13px] uppercase flex items-center justify-center gap-[10px]"
              >Мой профиль</NuxtLink
            >
            <button
              @click="handleLogout"
              class="w-full min-h-[56px] border border-[#cfcfcf] rounded-[10px] text-[#333] font-serif text-[13px] uppercase flex items-center justify-center gap-[10px]"
            >
              Выйти
            </button>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              class="w-full min-h-[56px] border border-[#cfcfcf] rounded-[10px] text-[#333] font-serif text-[13px] uppercase flex items-center justify-center gap-[10px]"
              >Войти</NuxtLink
            >
          </template>
          <button
            class="w-full min-h-[56px] border border-[#cfcfcf] rounded-[10px] text-[#333] font-serif text-[13px] uppercase flex items-center justify-center gap-[10px]"
          >
            Обратная связь
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <main
        class="mx-auto max-w-[1440px] w-full px-4 lg:px-8 flex-1 flex flex-col"
      >
        <slot />
      </main>

      <!-- Footer -->
      <footer class="pt-[clamp(56px,8vh,72px)] pb-[24px] text-[#333]">
        <div class="mx-auto max-w-[1440px] px-4 lg:px-8">
          <!-- Desktop Footer -->
          <div
            class="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center gap-[16px]"
          >
            <div class="flex flex-col items-start gap-[6px] text-[14px]">
              <NuxtLink to="/about" class="hover:opacity-70 transition-opacity"
                >О проекте</NuxtLink
              >
              <NuxtLink to="/terms" class="hover:opacity-70 transition-opacity"
                >Пользовательское соглашение</NuxtLink
              >
              <NuxtLink
                to="/privacy"
                class="hover:opacity-70 transition-opacity"
                >Политика конфиденциальности</NuxtLink
              >
            </div>
            <div class="flex items-center justify-center gap-[5px]">
              <a
                href="#"
                class="w-[30px] h-[30px] rounded-full bg-[#333] text-white flex items-center justify-center hover:opacity-75 transition-opacity"
                >YT</a
              >
              <a
                href="#"
                class="w-[30px] h-[30px] rounded-full bg-[#333] text-white flex items-center justify-center hover:opacity-75 transition-opacity"
                >TG</a
              >
            </div>
            <div class="justify-self-end text-right text-[14px] leading-[1.45]">
              <p>ИП Крицкий Роман Дмитриевич</p>
              <p>ИНН: 772796119977</p>
              <p>ОГРНИП: 325774600403322</p>
            </div>
          </div>
          <div class="hidden lg:block mt-[52px] text-center text-[14px]">
            Все права защищены. © Крицкий 2026
          </div>

          <!-- Mobile Footer -->
          <div class="lg:hidden">
            <div class="grid grid-cols-2 gap-[20px] items-start">
              <div class="flex flex-col gap-[4px] text-[13px]">
                <NuxtLink to="/about">О проекте</NuxtLink>
                <NuxtLink to="/terms">Пользовательское соглашение</NuxtLink>
                <NuxtLink to="/privacy">Политика конфиденциальности</NuxtLink>
              </div>
              <div class="text-right text-[12px] leading-[1.35]">
                <p>ИП Крицкий Роман Дмитриевич</p>
                <p>ИНН: 772796119977</p>
                <p>ОГРНИП: 325774600403322</p>
              </div>
            </div>
            <div class="mt-[16px] flex items-end justify-between">
              <div class="text-[12px]">
                <p>© Крицкий 2026</p>
                <p>Все права защищены.</p>
              </div>
              <div class="flex gap-[5px]">
                <a
                  href="#"
                  class="w-[34px] h-[34px] rounded-full bg-[#333] text-white flex items-center justify-center"
                  >YT</a
                >
                <a
                  href="#"
                  class="w-[34px] h-[34px] rounded-full bg-[#333] text-white flex items-center justify-center"
                  >TG</a
                >
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.icon-list::before {
  content: '📋';
}
.icon-book::before {
  content: '📚';
}
.icon-cart::before {
  content: '🛒';
}
.icon-bookmark::before {
  content: '🔖';
}
.icon-profile::before {
  content: '👤';
}
</style>
