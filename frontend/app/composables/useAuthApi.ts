/**
 * Composable for making authenticated API calls with JWT tokens
 *
 * Uses nuxt-auth-utils session to store JWT tokens
 * Automatically refreshes tokens when expired
 */
export const useAuthApi = () => {
  const config = useRuntimeConfig();
  const { session, fetch: fetchSession } = useUserSession();

  const apiUrl = import.meta.server
    ? config.apiBackendUrl
    : config.public.apiUrl;

  /**
   * Get current access token from session
   */
  const getAccessToken = (): string | null => {
    return session.value?.accessToken || null;
  };

  /**
   * Get current refresh token from session
   */
  const getRefreshToken = (): string | null => {
    return session.value?.refreshToken || null;
  };

  /**
   * Refresh the access token using the refresh token
   */
  const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      await $fetch('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });
      await fetchSession();
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Make an authenticated API request with automatic token refresh
   */
  const fetchWithAuth = async <T>(
    url: string,
    options: Parameters<typeof $fetch>[1] = {},
  ): Promise<T> => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        throw new Error('Требуется авторизация');
      }
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${getAccessToken()}`,
    };

    try {
      return await $fetch<T>(url, {
        ...options,
        headers,
      });
    } catch (error: unknown) {
      // Check if it's a 401 error
      if (
        error instanceof Error &&
        'statusCode' in error &&
        (error as { statusCode: number }).statusCode === 401
      ) {
        // Try to refresh token and retry
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Сессия истекла. Войдите снова.');
        }

        // Retry with new token
        return await $fetch<T>(url, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${getAccessToken()}`,
          },
        });
      }
      throw error;
    }
  };

  /**
   * Make authenticated request to backend API (with base URL prefix)
   */
  const apiWithAuth = async <T>(
    path: string,
    options: Parameters<typeof $fetch>[1] = {},
  ): Promise<T> => {
    const url = path.startsWith('/') ? `${apiUrl}${path}` : `${apiUrl}/${path}`;
    return fetchWithAuth<T>(url, options);
  };

  return {
    getAccessToken,
    getRefreshToken,
    refreshAccessToken,
    fetchWithAuth,
    apiWithAuth,
  };
};
