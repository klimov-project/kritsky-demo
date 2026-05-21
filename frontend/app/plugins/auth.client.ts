export default defineNuxtPlugin(async (nuxtApp) => {
  if (import.meta.server) return;

  const { useAuth } = await import('~/composables/useAuth');
  const { useUserStore } = await import('~/stores/user');

  const auth = useAuth();
  const userStore = useUserStore();

  console.log('Validating session on app initialization...');

  // Проверяем пользователя
  const data = await auth.checkMe();

  const syncUserStore = () => {
    if (auth.user.value) {
      userStore.setUser(data);
    } else {
      userStore.clearUser();
    }
  };

  syncUserStore();
});
