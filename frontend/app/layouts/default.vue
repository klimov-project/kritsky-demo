<script setup lang="ts">
const auth = useAuth();
const { session, isAuthenticated, logout, isLoading: authLoading } = auth;
const showUserMenu = ref(false);
const showMobileMenu = ref(false);

const handleLogout = async () => {
  try {
    await logout();
    showUserMenu.value = false;
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Close dropdowns when clicking outside
const closeMenus = () => {
  showUserMenu.value = false;
  showMobileMenu.value = false;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50" @click="closeMenus">
    <!-- Header/Navigation -->
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <!-- Logo -->
          <NuxtLink to="/" class="text-2xl font-bold text-blue-600">
            Критский
          </NuxtLink>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex gap-6 text-sm items-center">
            <NuxtLink
              to="/"
              class="text-gray-700 hover:text-blue-600 transition"
              active-class="text-blue-600 font-medium"
            >
              Главная
            </NuxtLink>
            <NuxtLink
              to="/new_test"
              class="text-gray-700 hover:text-blue-600 transition"
              active-class="text-blue-600 font-medium"
            >
              Конструктор
            </NuxtLink>
            <NuxtLink
              to="/shop"
              class="text-gray-700 hover:text-blue-600 transition"
              active-class="text-blue-600 font-medium"
            >
              Подписка
            </NuxtLink>

            <!-- User Menu -->
            <div class="relative" @click.stop>
              <button
                v-if="isAuthenticated"
                @click="showUserMenu = !showUserMenu"
                class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                <span class="font-medium text-sm truncate max-w-[150px]">
                  {{ session?.user?.name || session?.user?.email }}
                </span>
                <span class="text-xs">▼</span>
              </button>
              <NuxtLink
                v-else
                to="/login"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Войти
              </NuxtLink>

              <!-- Dropdown Menu -->
              <div
                v-if="isAuthenticated && showUserMenu"
                class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50"
              >
                <NuxtLink
                  to="/profile"
                  class="block px-4 py-3 text-gray-700 hover:bg-gray-50 first:rounded-t-lg border-b"
                >
                  Профиль
                </NuxtLink>
                <NuxtLink
                  to="/my-variants"
                  class="block px-4 py-3 text-gray-700 hover:bg-gray-50"
                >
                  Мои варианты
                </NuxtLink>
                <NuxtLink
                  to="/my-books"
                  class="block px-4 py-3 text-gray-700 hover:bg-gray-50"
                >
                  Мои книги
                </NuxtLink>
                <NuxtLink
                  to="/saved"
                  class="block px-4 py-3 text-gray-700 hover:bg-gray-50 border-b"
                >
                  Избранное
                </NuxtLink>
                <NuxtLink
                  to="/cart"
                  class="block px-4 py-3 text-gray-700 hover:bg-gray-50 border-b"
                >
                  Корзина
                </NuxtLink>
                <button
                  @click="handleLogout"
                  :disabled="authLoading"
                  class="w-full text-left px-4 py-3 text-red-600 hover:bg-gray-50 last:rounded-b-lg disabled:opacity-50"
                >
                  {{ authLoading ? 'Выход...' : 'Выйти' }}
                </button>
              </div>
            </div>
          </nav>

          <!-- Mobile Menu Toggle -->
          <button
            @click.stop="showMobileMenu = !showMobileMenu"
            class="md:hidden p-2 text-gray-600"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="!showMobileMenu"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Mobile Navigation -->
        <nav
          v-if="showMobileMenu"
          class="md:hidden mt-4 pb-4 border-t pt-4 space-y-2"
          @click.stop
        >
          <NuxtLink to="/" class="block py-2 text-gray-700 hover:text-blue-600">
            Главная
          </NuxtLink>
          <NuxtLink
            to="/new_test"
            class="block py-2 text-gray-700 hover:text-blue-600"
          >
            Конструктор
          </NuxtLink>
          <NuxtLink
            to="/shop"
            class="block py-2 text-gray-700 hover:text-blue-600"
          >
            Подписка
          </NuxtLink>
          <template v-if="isAuthenticated">
            <NuxtLink
              to="/profile"
              class="block py-2 text-gray-700 hover:text-blue-600"
            >
              Профиль
            </NuxtLink>
            <NuxtLink
              to="/my-variants"
              class="block py-2 text-gray-700 hover:text-blue-600"
            >
              Мои варианты
            </NuxtLink>
            <NuxtLink
              to="/my-books"
              class="block py-2 text-gray-700 hover:text-blue-600"
            >
              Мои книги
            </NuxtLink>
            <button @click="handleLogout" class="block py-2 text-red-600">
              Выйти
            </button>
          </template>
          <NuxtLink
            v-else
            to="/login"
            class="block py-2 text-blue-600 font-medium"
          >
            Войти
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-200 py-8 mt-16">
      <div class="max-w-6xl mx-auto px-4">
        <div class="grid md:grid-cols-3 gap-8 mb-6 text-sm">
          <div>
            <h4 class="font-bold mb-3">Информация</h4>
            <div class="space-y-1">
              <NuxtLink to="/about" class="block hover:text-white">
                О проекте
              </NuxtLink>
              <NuxtLink to="/privacy" class="block hover:text-white">
                Политика конфиденциальности
              </NuxtLink>
              <NuxtLink to="/terms" class="block hover:text-white">
                Пользовательское соглашение
              </NuxtLink>
            </div>
          </div>
          <div>
            <h4 class="font-bold mb-3">Работа</h4>
            <div class="space-y-1">
              <NuxtLink to="/new_test" class="block hover:text-white">
                Конструктор
              </NuxtLink>
              <NuxtLink to="/rules" class="block hover:text-white">
                Правила
              </NuxtLink>
              <a
                href="mailto:support@kritsky.academy"
                class="block hover:text-white"
              >
                Поддержка
              </a>
            </div>
          </div>
          <div>
            <h4 class="font-bold mb-3">Контакты</h4>
            <p class="text-xs">ИП Крицкий Роман Дмитриевич</p>
            <p class="text-xs">ИНН: 772796119977</p>
            <p class="text-xs">ОГРНИП: 325774600403322</p>
          </div>
        </div>
        <div class="border-t border-gray-700 pt-6 text-center text-xs">
          <p>Критский, 2026. Все права защищены.</p>
        </div>
      </div>
    </footer>
  </div>
</template>
