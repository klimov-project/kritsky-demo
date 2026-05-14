/**
 * Authentication composable using nuxt-auth-utils with JWT tokens
 *
 * Uses sealed session cookies to store JWT tokens (accessToken, refreshToken)
 * The tokens are used for backend API authentication
 */

export interface AuthUser {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: 'user' | 'admin';
  isPro: boolean;
  isBlocked: boolean;
}

export const useAuth = () => {
  const router = useRouter();
  const route = useRoute();

  // Use the built-in session composable from nuxt-auth-utils
  const {
    loggedIn,
    user,
    session,
    fetch: fetchSession,
    clear: clearSession,
  } = useUserSession();

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Login - calls our API which proxies to backend and sets JWT tokens in session
   */
  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      // Refresh session after login to get tokens
      await fetchSession();
      return result;
    } catch (err: unknown) {
      const fetchError = err as {
        data?: { message?: string };
        statusMessage?: string;
      };
      error.value =
        fetchError?.data?.message ||
        fetchError?.statusMessage ||
        'Ошибка входа';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Register - calls our API which proxies to backend and sets JWT tokens in session
   */
  const register = async (email: string, password: string, name?: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email, password, name },
      });
      // Refresh session after registration to get tokens
      await fetchSession();
      return result;
    } catch (err: unknown) {
      const fetchError = err as {
        data?: { message?: string };
        statusMessage?: string;
      };
      error.value =
        fetchError?.data?.message ||
        fetchError?.statusMessage ||
        'Ошибка регистрации';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Logout - clears session and JWT tokens
   */
  const logout = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      });
      await clearSession();
      await router.push('/');
    } catch (err: unknown) {
      const fetchError = err as {
        data?: { message?: string };
        statusMessage?: string;
      };
      error.value =
        fetchError?.data?.message || fetchError?.statusMessage || 'Ошибка при выходе';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (payload: {
    name?: string;
    email?: string;
    phone?: string;
  }) => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await $fetch('/api/auth/profile', {
        method: 'PUT',
        body: payload,
      });
      // Refresh session to get updated user data
      await fetchSession();
      return result;
    } catch (err: unknown) {
      const fetchError = err as {
        data?: { message?: string };
        statusMessage?: string;
      };
      error.value =
        fetchError?.data?.message ||
        fetchError?.statusMessage ||
        'Ошибка обновления профиля';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Change password
   */
  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    isLoading.value = true;
    error.value = null;
    try {
      await $fetch('/api/auth/change-password', {
        method: 'POST',
        body: {
          oldPassword: currentPassword,
          newPassword,
        },
      });
    } catch (err: unknown) {
      const fetchError = err as {
        data?: { message?: string };
        statusMessage?: string;
      };
      error.value =
        fetchError?.data?.message ||
        fetchError?.statusMessage ||
        'Ошибка смены пароля';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Open login modal
   */
  const openLoginModal = (tab: 'login' | 'register' = 'login') => {
    router.push({
      path: route.path,
      query: { ...route.query, modal: tab },
    });
  };

  /**
   * Close login modal
   */
  const closeLoginModal = () => {
    const { modal: _, ...restQuery } = route.query;
    router.push({
      path: route.path,
      query: restQuery,
    });
  };

  /**
   * Check if login modal should be open
   */
  const isLoginModalOpen = computed(() => {
    return route.query.modal === 'login' || route.query.modal === 'register';
  });

  /**
   * Get the active auth tab from URL
   */
  const activeAuthTab = computed(() => {
    return route.query.modal === 'register' ? 'register' : 'login';
  });

  return {
    // Session state from nuxt-auth-utils
    session: computed(() => ({
      user: user.value as AuthUser | null,
      accessToken: session.value?.accessToken,
      refreshToken: session.value?.refreshToken,
    })),
    user: computed(() => user.value as AuthUser | null),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAuthenticated: computed(() => loggedIn.value),
    isAdmin: computed(
      () => (user.value as AuthUser | null)?.role === 'admin',
    ),
    isPro: computed(() => (user.value as AuthUser | null)?.isPro || false),

    // Auth methods
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    fetchSession,

    // Modal helpers
    openLoginModal,
    closeLoginModal,
    isLoginModalOpen,
    activeAuthTab,
  };
};
