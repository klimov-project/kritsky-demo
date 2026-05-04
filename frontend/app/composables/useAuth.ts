export const useAuth = () => {
  const router = useRouter();
  const session = ref<any>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Fetch current session
  const fetchSession = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await $fetch('/api/auth/me', {
        method: 'GET',
      });
      session.value = result;
    } catch (err: any) {
      console.error('Session fetch error:', err);
      session.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      session.value = result;
      return result;
    } catch (err: any) {
      error.value = err?.data?.message || 'Login failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Register
  const register = async (
    email: string,
    password: string,
    name?: string,
  ) => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email, password, name },
      });
      session.value = result;
      return result;
    } catch (err: any) {
      error.value = err?.data?.message || 'Registration failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Logout
  const logout = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      });
      session.value = null;
      await router.push('/');
    } catch (err: any) {
      error.value = err?.data?.message || 'Logout failed';
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
      session.value = result;
      return result;
    } catch (err: any) {
      error.value = err?.data?.message || 'Profile update failed';
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
    } catch (err: any) {
      error.value = err?.data?.message || 'Password change failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Initialize session on client
  if (process.client) {
    onMounted(() => {
      fetchSession();
    });
  }

  return {
    session: readonly(session),
    isLoading: readonly(isLoading),
    error: readonly(error),
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    fetchSession,
    isAuthenticated: computed(() => !!session.value?.user),
  };
};
