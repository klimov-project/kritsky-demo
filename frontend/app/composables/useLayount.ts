const showMobileMenu = ref(false); // Выносим за пределы функции

export const useLayout = () => {
  const auth = useAuth();
  const { isAuthenticated, logout, openLoginModal } = auth;

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

  // Close mobile menu on route change
  const route = useRoute();
  watch(
    () => route.fullPath,
    () => {
      showMobileMenu.value = false;
    },
  );

  const isIndexPage = computed(() => route.path === '/');
  const isVariantPage = computed(() => route.path === '/create-variant');
  const hasOverflowHidden = computed(() => !isVariantPage.value);

  return {
    showMobileMenu,
    isAuthenticated,
    handleLogout,
    handleLogin,
    toggleMobileMenu,
    isIndexPage,
    isVariantPage,
    hasOverflowHidden,
  };
};
