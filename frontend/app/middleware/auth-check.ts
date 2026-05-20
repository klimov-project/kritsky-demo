export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuth()
  const { isAuthenticated, logout } = auth

  // Check if user is on a protected page
  if (to.path.startsWith('/profile')) {
    if (!isAuthenticated.value) {
      return navigateTo('/auth?modal=login')
    }

    // Verify auth is still valid on protected pages
    try {
      await $fetch('/api/auth/me')
    } catch (error: any) {
      if (error?.status === 401) {
        // Session expired - logout and redirect
        await logout()
        return navigateTo('/auth?modal=login')
      }
    }
  }
})
