<script setup lang="ts">
const route = useRoute();
const auth = useAuth();
const {
  session,
  isLoading: authLoading,
  isAuthenticated,
  logout,
  openLoginModal,
} = auth;
const showMobileMenu = ref(false);

const handleLogout = async () => {
  try {
    await logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

const handleLogin = () => {
  openLoginModal('login');
};

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

watch(
  () => route.fullPath,
  () => {
    showMobileMenu.value = false;
  },
);

const isIndexPage = computed(() => route.path === '/');
const isVariantPage = computed(() => route.path === '/create-variant');
const hasBackgroundLayer = computed(() => isIndexPage.value);
const hasOverflowHidden = computed(() => !isVariantPage.value);
</script>
<template>
  <div class="min-h-screen">
    <div
      :class="[
        'w-full min-h-screen flex flex-col relative',
        hasOverflowHidden
          ? 'bg-transparent z-10 overflow-hidden'
          : 'bg-default',
      ]"
    >
      <!-- Header -->
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
            <!-- <NuxtLink
              to="/shop"
              class="nav-link-animated text-[#333] font-serif text-[18px] uppercase"
            >
              Магазин
            </NuxtLink> -->
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
              <!-- <span class="w-[1px] h-[26px] bg-[#cfcfcf]"></span> -->
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
            <NuxtLink to="/subscriptions" class="text-[#333]">
              <IconShoppingBag />
            </NuxtLink>
            <button
              @click="toggleMobileMenu"
              class="ml-auto flex items-center text-[#333]"
            >
              <IconMenu />
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
          <!-- <NuxtLink
            to="/subscriptions"
            class="w-full min-h-[58px] rounded-[10px] bg-[#f6f6f6] text-[#333] font-serif text-[18px] uppercase flex items-center px-[24px]"
          >
            Магазин
          </NuxtLink> -->
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

      <div
        class="relative mx-auto max-w-[1440px] w-full px-4 lg:px-6 py-6 lg:py-8"
      >
        <div
          class="row text-center font-normal text-4xl leading-[42px] mb-[32px]"
        >
          <h1>Личный кабинет</h1>
        </div>

        <div
          class="grid grid-cols-1 lg:grid-cols-[270px_minmax(auto,1fr)_270px] gap-5"
        >
          <ProfileSidebar active-item="profile" />

          <main class="min-w-0 bg-white rounded-[10px] p-5 lg:p-6">
            <slot />
          </main>
          <!-- Правая колонка (пустая для симметрии) -->
          <div class="hidden lg:block"></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="pt-[clamp(56px,8vh,72px)] pb-[24px] text-[#333]">
      <div class="mx-auto max-w-[1440px] px-4 lg:px-8">
        <!-- Desktop Footer -->
        <div
          class="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center gap-[16px]"
        >
          <div class="flex flex-col items-start gap-[6px] text-[14px]">
            <NuxtLink to="/about" class="nav-link-animated transition-opacity"
              >О проекте</NuxtLink
            >
            <NuxtLink to="/terms" class="nav-link-animated transition-opacity"
              >Пользовательское соглашение</NuxtLink
            >
            <NuxtLink to="/privacy" class="nav-link-animated transition-opacity"
              >Политика конфиденциальности</NuxtLink
            >
          </div>
          <div class="flex items-center justify-center gap-[5px]">
            <a
              href="https://www.youtube.com/@romankritsky"
              class="w-[30px] h-[30px] rounded-full bg-[#333] text-white flex items-center justify-center hover:opacity-75 transition-opacity"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconYT />
            </a>
            <a
              href="https://t.me/romankritsky"
              class="w-[30px] h-[30px] rounded-full bg-[#333] text-white flex items-center justify-center hover:opacity-75 transition-opacity"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconTG />
            </a>
          </div>
          <div
            class="justify-self-end text-right text-[14px] leading-[1.45] flex flex-col items-start gap-[6px] text-[14px]"
          >
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
          <div class="grid mb-8 grid-cols-2 gap-[20px] items-start">
            <div class="flex flex-col gap-[4px] text-[13px]">
              <NuxtLink to="/about">О проекте</NuxtLink>
              <NuxtLink to="/terms">Пользовательское соглашение</NuxtLink>
              <NuxtLink to="/privacy">Политика конфиденциальности</NuxtLink>
            </div>
            <div class="text-right text-[12px] leading-[1.9] lg:leading-[1.35]">
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
                href="https://www.youtube.com/@romankritsky"
                class="w-[34px] h-[34px] rounded-full bg-[#333] text-white flex items-center justify-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconYT />
              </a>
              <a
                href="https://t.me/romankritsky"
                class="w-[34px] h-[34px] rounded-full bg-[#333] text-white flex items-center justify-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconTG />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.bg-default {
  background-color: var(--home-color-bg);
  position: relative;
  // overflow: hidden;
}

.bg-default:before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 10;
  background: url('/periya-full-x2-compress.svg') repeat-y 0 159px / 100%;
  opacity: 0.015;
  pointer-events: none;
  display: none;
}
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
