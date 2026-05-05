/**
 * Auth middleware using nuxt-auth-utils
 * 
 * This middleware protects routes that require authentication.
 * Use by adding `definePageMeta({ middleware: 'auth' })` to pages.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Use the built-in session composable from nuxt-auth-utils
  const { loggedIn, fetch: fetchSession } = useUserSession();
  
  // Ensure we have the latest session state
  if (!loggedIn.value) {
    await fetchSession();
  }
  
  // If still not logged in after fetching, redirect to login
  if (!loggedIn.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  }
});
