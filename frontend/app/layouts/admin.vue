<script setup lang="ts">
const auth = useAuth();
const { session, logout, isLoading: authLoading } = auth;
const route = useRoute();

const sidebarOpen = ref(true);

const navigation = [
  { name: 'Дашборд', href: '/admin', icon: '📊' },
  { name: 'Пользователи', href: '/admin/users', icon: '👥' },
  { name: 'Материалы', href: '/admin/materials', icon: '📚' },
  { name: 'Заказы', href: '/admin/orders', icon: '📦' },
  { name: 'Платежи', href: '/admin/payments', icon: '💳' },
  { name: 'Книги', href: '/admin/books', icon: '📖' },
];

const handleLogout = async () => {
  try {
    await logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

const isActive = (href: string) => {
  if (href === '/admin') {
    return route.path === '/admin';
  }
  return route.path.startsWith(href);
};
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 bg-gray-800">
        <NuxtLink to="/admin" class="text-xl font-bold">
          Критский Admin
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="mt-6 px-3">
        <NuxtLink
          v-for="item in navigation"
          :key="item.href"
          :to="item.href"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition',
            isActive(item.href)
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white',
          ]"
        >
          <span>{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <!-- User Info -->
      <div
        class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm"
            >
              {{ session?.user?.name?.charAt(0) || 'A' }}
            </div>
            <div class="text-sm">
              <p class="font-medium truncate max-w-[120px]">
                {{ session?.user?.name || 'Admin' }}
              </p>
              <p class="text-gray-400 text-xs">Администратор</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            :disabled="authLoading"
            class="text-gray-400 hover:text-white"
            title="Выйти"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div
      :class="['transition-all duration-200', sidebarOpen ? 'ml-64' : 'ml-0']"
    >
      <!-- Top Bar -->
      <header
        class="h-16 bg-white shadow-sm flex items-center px-6 sticky top-0 z-40"
      >
        <button
          @click="sidebarOpen = !sidebarOpen"
          class="p-2 hover:bg-gray-100 rounded-lg mr-4"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div class="flex-1"></div>

        <NuxtLink to="/" class="text-sm text-gray-600 hover:text-gray-900">
          ← На сайт
        </NuxtLink>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
