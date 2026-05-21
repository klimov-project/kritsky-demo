/**
 * Auth API helper for authenticated backend requests.
 * Uses direct JWT auth from the shared auth composable.
 */
export const useAuthApi = () => {
  const auth = useAuth();

  return {
    getAccessToken: () => auth.accessToken.value,
    getRefreshToken: () => auth.refreshToken.value,
    refreshAccessToken: auth.refreshTokens,
    fetchWithAuth: auth.fetchWithAuth,
    apiWithAuth: auth.apiWithAuth,
  };
};
