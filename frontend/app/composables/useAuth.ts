/**
 * Authentication composable for direct JWT auth with the backend.
 *
 * Stores access and refresh tokens in client cookies and sends Bearer tokens
 * directly to backend `/auth/*` endpoints.
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

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

type FetchOptions = Parameters<typeof $fetch>[1];

const STORAGE_COOKIE_OPTIONS = {
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

export const useAuth = () => {
  const router = useRouter();
  const route = useRoute();
  const config = useRuntimeConfig();

  const accessToken = useCookie<string | null>('auth.accessToken', STORAGE_COOKIE_OPTIONS);
  const refreshToken = useCookie<string | null>('auth.refreshToken', STORAGE_COOKIE_OPTIONS);
  const user = useCookie<AuthUser | null>('auth.user', STORAGE_COOKIE_OPTIONS);

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const apiUrl = computed(() => config.public.apiUrl.replace(/\/$/, ''));

  const buildUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${apiUrl.value}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const normalizeError = (error: unknown) => {
    const err = error as any;
    if (err?.data?.message) return err.data.message;
    if (err?.statusMessage) return err.statusMessage;
    if (typeof err?.message === 'string') return err.message;
    return 'Произошла ошибка при запросе';
  };

  const isUnauthorizedError = (error: unknown) => {
    const err = error as any;
    return err?.status === 401 || err?.statusCode === 401 || err?.statusCode === '401';
  };

  const setSession = (payload: AuthResponse) => {
    accessToken.value = payload.accessToken;
    refreshToken.value = payload.refreshToken;
    user.value = payload.user;
  };

  const clearSession = () => {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
  };

  const session = computed(() => ({
    user: user.value,
    accessToken: accessToken.value,
    refreshToken: refreshToken.value,
  }));

  const fetchSession = async () => {
    await validateSession();
  };

  const fetchJson = async <T>(path: string, options: FetchOptions = {}) => {
    try {
      return await $fetch<T>(buildUrl(path), {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
      });
    } catch (error) {
      throw error;
    }
  };

  const refreshTokens = async (): Promise<boolean> => {
    if (!refreshToken.value) {
      return false;
    }

    try {
      const payload = await fetchJson<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: refreshToken.value },
      });
      setSession(payload);
      return true;
    } catch (error) {
      clearSession();
      return false;
    }
  };

  const fetchWithAuth = async <T>(
    path: string,
    options: FetchOptions = {},
    retry = true,
  ): Promise<T> => {
    if (!accessToken.value && refreshToken.value) {
      await refreshTokens();
    }

    if (!accessToken.value) {
      throw new Error('Требуется авторизация');
    }

    try {
      return await fetchJson<T>(path, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${accessToken.value}`,
        },
      });
    } catch (error) {
      if (isUnauthorizedError(error) && retry) {
        const refreshed = await refreshTokens();
        if (refreshed && accessToken.value) {
          return fetchWithAuth<T>(path, options, false);
        }
        clearSession();
      }
      throw error;
    }
  };

  const apiWithAuth = async <T>(
    path: string,
    options: FetchOptions = {},
  ): Promise<T> => {
    return fetchWithAuth<T>(path, options);
  };

  const validateSession = async (): Promise<boolean> => {
    if (!accessToken.value && !refreshToken.value) {
      return false;
    }

    if (!user.value) {
      try {
        const profile = await fetchWithAuth<AuthUser>('/auth/me', { method: 'GET' });
        user.value = profile;
        return true;
      } catch {
        if (refreshToken.value) {
          const refreshed = await refreshTokens();
          if (refreshed) {
            try {
              const profile = await fetchWithAuth<AuthUser>('/auth/me', {
                method: 'GET',
              });
              user.value = profile;
              return true;
            } catch {
              clearSession();
            }
          }
        }
        return false;
      }
    }

    try {
      await fetchWithAuth('/auth/me', { method: 'GET' });
      return true;
    } catch {
      if (refreshToken.value) {
        const refreshed = await refreshTokens();
        if (refreshed) {
          try {
            const profile = await fetchWithAuth<AuthUser>('/auth/me', {
              method: 'GET',
            });
            user.value = profile;
            return true;
          } catch {
            clearSession();
          }
        }
      }
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const payload = await fetchJson<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setSession(payload);
      return payload;
    } catch (error) {
      error.value = normalizeError(error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const payload = await fetchJson<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { email, password, name },
      });
      setSession(payload);
      return payload;
    } catch (error) {
      error.value = normalizeError(error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    clearSession();
    router.push('/login');
  };

  const updateProfile = async (payload: {
    name?: string;
    email?: string;
    phone?: string;
  }) => {
    isLoading.value = true;
    error.value = null;
    try {
      const update = await fetchWithAuth<AuthUser>('/auth/profile', {
        method: 'PUT',
        body: payload,
      });
      user.value = update;
      return update;
    } catch (error) {
      error.value = normalizeError(error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    isLoading.value = true;
    error.value = null;
    try {
      await fetchWithAuth('/auth/change-password', {
        method: 'POST',
        body: {
          oldPassword: currentPassword,
          newPassword,
        },
      });
    } catch (error) {
      error.value = normalizeError(error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const openLoginModal = (tab: 'login' | 'register' = 'login') => {
    router.push({
      path: route.path,
      query: { ...route.query, modal: tab },
    });
  };

  const closeLoginModal = () => {
    const { modal: _, ...restQuery } = route.query;
    router.push({
      path: route.path,
      query: restQuery,
    });
  };

  const isLoginModalOpen = computed(() => {
    return route.query.modal === 'login' || route.query.modal === 'register';
  });

  const activeAuthTab = computed(() => {
    return route.query.modal === 'register' ? 'register' : 'login';
  });

  const isPro = computed(() => user.value?.isPro || false);

  return {
    accessToken,
    refreshToken,
    user,
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAuthenticated: computed(() => !!accessToken.value && !!user.value),
    isLocked: computed(() => !accessToken.value || !isPro.value),
    isAdmin: computed(() => user.value?.role === 'admin'),
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    validateSession,
    fetchWithAuth,
    apiWithAuth,
    setSession,
    clearSession,
    fetchSession,
    session,
    openLoginModal,
    closeLoginModal,
    isLoginModalOpen,
    activeAuthTab,
  };
};
