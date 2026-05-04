export default defineRouteMiddleware(async (to, from) => {
  // Define routes that require authentication
  const protectedRoutes = ['/profile', '/my-variants', '/my-books'];

  if (
    protectedRoutes.some((route) => to.path.startsWith(route))
  ) {
    try {
      const session = await useFetch('/api/auth/me', {
        method: 'GET',
      });

      if (!session.data?.value?.user) {
        return navigateTo({
          path: '/login',
          query: { redirect: to.fullPath },
        });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath },
      });
    }
  }
});
