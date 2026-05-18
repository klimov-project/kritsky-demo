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
    console.log('[useAuth.login] Started', {
      email,
      timestamp: new Date().toISOString(),
    });

    isLoading.value = true;
    error.value = null;

    try {
      console.log('[useAuth.login] Calling /api/auth/login');
      const result = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      console.log('[useAuth.login] Login API response:', {
        success: result.success,
        hasUser: !!result.user,
        userId: result.user?.id,
      });

      console.log('[useAuth.login] About to call fetchSession()');

      // Add small delay to ensure server has set cookies
      await new Promise((resolve) => setTimeout(resolve, 100));

      await fetchSession();

      console.log('[useAuth.login] After fetchSession() - checking state:', {
        loggedIn: loggedIn.value,
        userId: user.value?.id,
        hasSession: !!session.value,
        sessionUser: session.value?.user,
        hasAccessToken: !!session.value?.accessToken,
      });

      // Verify session was actually set
      if (!loggedIn.value || !user.value) {
        console.warn(
          '[useAuth.login] Session not properly set after fetchSession',
        );

        // Try one more fetch after a short delay
        console.log('[useAuth.login] Retrying fetchSession after 200ms...');
        await new Promise((resolve) => setTimeout(resolve, 200));
        await fetchSession();

        console.log('[useAuth.login] After second fetchSession:', {
          loggedIn: loggedIn.value,
          userId: user.value?.id,
        });
      }

      return result;
    } catch (err) {
      console.error('[useAuth.login] Error during login:', {
        error: err,
        message: err.message,
        status: err.status,
        data: err.data,
      });

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
      console.log('[useAuth.login] Finished, isLoading set to false');
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
    } catch (err) {
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
   * Logout function with debugging
   */
  const logout = async () => {
    console.log('[useAuth.logout] Started');

    try {
      await $fetch('/api/auth/logout', { method: 'POST' });
      await clearSession();

      console.log('[useAuth.logout] After clearSession:', {
        loggedIn: loggedIn.value,
        user: user.value,
      });

      router.push('/login');
    } catch (err) {
      console.error('[useAuth.logout] Error:', err);
      throw err;
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
    } catch (err) {
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
    } catch (err) {
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

  const isPro = computed(() => (user.value as AuthUser | null)?.isPro || false);

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
    isLocked: computed(() => !loggedIn.value || !isPro.value),
    isAdmin: computed(() => (user.value as AuthUser | null)?.role === 'admin'),

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

    // Debug
    loggedIn,
    clearSession,
  };
};
