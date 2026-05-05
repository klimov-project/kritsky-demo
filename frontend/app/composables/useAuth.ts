/**
 * Authentication composable using nuxt-auth-utils
 *
 * Uses the built-in useUserSession() from nuxt-auth-utils module
 * which manages session via sealed cookies (encrypted with NUXT_SESSION_PASSWORD)
 */

export const useAuth = () => {
  const router = useRouter();

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

  // Login - calls our API which proxies to backend and sets session
  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      // Refresh session after login
      await fetchSession();
      return result;
    } catch (err) {
      error.value = err?.data?.message || err?.statusMessage || 'Login failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Register - calls our API which proxies to backend and sets session
  const register = async (email: string, password: string, name?: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email, password, name },
      });
      // Refresh session after registration
      await fetchSession();
      return result;
    } catch (err) {
      error.value =
        err?.data?.message || err?.statusMessage || 'Registration failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Logout - clears session
  const logout = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      });
      await clearSession();
      await router.push('/');
    } catch (err) {
      error.value = err?.data?.message || err?.statusMessage || 'Logout failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Update profile
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
      error.value =
        err?.data?.message || err?.statusMessage || 'Profile update failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Change password
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
      error.value =
        err?.data?.message || err?.statusMessage || 'Password change failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // Session state from nuxt-auth-utils
    session: computed(() => ({ user: user.value })),
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAuthenticated: computed(() => loggedIn.value),

    // Auth methods
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    fetchSession,
  };
};
