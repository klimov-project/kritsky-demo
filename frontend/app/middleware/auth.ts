/**
 * Auth middleware using nuxt-auth-utils
 *
 * This middleware protects routes that require authentication.
 * Use by adding `definePageMeta({ middleware: 'auth' })` to pages.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();

  if (!auth.isAuthenticated.value) {
    const valid = await auth.validateSession();
    if (!valid) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath },
      });
    }
  }
});
