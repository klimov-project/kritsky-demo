<script setup lang="ts">
/**
 * Login page - redirects to modal or shows standalone form
 *
 * Supports both:
 * - /login route (standalone page)
 * - ?modal=login (modal overlay from any page)
 */

const router = useRouter();
const { query } = useRoute();

const { openLoginModal, isAuthenticated, isLoginModalOpen } = useAuth();

watch(isLoginModalOpen, o => !o && router.push('/'));
const resolveLogin = () => {
  const redirectPath = query.redirect as string;
  if (isAuthenticated.value) {
    if (redirectPath) {
      router.push(redirectPath);
    } else {
      router.push('/');
    }
  } else {
    openLoginModal();
  }
};
onMounted(() => {
  resolveLogin();
});
</script>

<template>
  <div class="min-h-screen"></div>
</template>
