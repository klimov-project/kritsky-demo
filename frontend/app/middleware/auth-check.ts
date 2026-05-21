export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();

  if (to.path.startsWith('/profile')) {
    const valid = await auth.validateSession();
    if (!valid) {
      return navigateTo('/auth?modal=login');
    }
  }
});
