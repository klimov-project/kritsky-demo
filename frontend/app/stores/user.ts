import { defineStore } from 'pinia';

export interface User {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'user' | 'admin';
  isPro: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  paidDownloadCredits: number;
  subscriptionExpiresAt: string | null;
}

export interface ExportQuota {
  hasActiveSubscription: boolean;
  dailyExcerptsLimit: number;
  dailyExcerptsUsed: number;
  dailyExcerptsRemaining: number;
  dailyPoemsLimit: number;
  dailyPoemsUsed: number;
  dailyPoemsRemaining: number;
  paidDownloadsRemaining: number;
  dailyFreeLimit: number;
  dailyFreeUsed: number;
  dailyFreeRemaining: number;
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const quota = ref<ExportQuota | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetch user data from backend auth endpoint
   */
  const fetchUser = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const authApi = useAuthApi();
      const data = await authApi.apiWithAuth<User>('/auth/me');
      setUser(data);
      return data;
    } catch (err) {
      const fetchError = err as { data?: { message?: string } };
      error.value = fetchError?.data?.message || 'Failed to fetch user data';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch export quota from backend endpoint
   */
  const fetchQuota = async () => {
    try {
      const authApi = useAuthApi();
      const data = await authApi.apiWithAuth<ExportQuota>('/variants/quota');
      quota.value = data;
      return data;
    } catch (err) {
      console.error('[v0] Failed to fetch quota:', err);
      return null;
    }
  };

  /**
   * Update user locally (after profile update)
   */
  const setUser = (newUser: User | null) => {
    user.value = newUser;
  };

  /**
   * Clear user data on logout
   */
  const clearUser = () => {
    user.value = null;
    quota.value = null;
  };

  /**
   * Format subscription expiry date
   */
  const subscriptionExpiryFormatted = computed(() => {
    if (!user.value?.subscriptionExpiresAt) return null;
    const date = new Date(user.value.subscriptionExpiresAt);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  });

  /**
   * Check if subscription is active
   */
  const hasActiveSubscription = computed(() => {
    if (!user.value?.isPro) return false;
    if (!user.value.subscriptionExpiresAt) return false;
    return new Date(user.value.subscriptionExpiresAt) > new Date();
  });

  return {
    user,
    quota,
    isLoading,
    error,
    fetchUser,
    fetchQuota,
    setUser,
    clearUser,
    subscriptionExpiryFormatted,
    hasActiveSubscription,
  };
});
