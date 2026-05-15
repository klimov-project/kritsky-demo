<script setup lang="ts">
const { isAuthenticated, openLoginModal } = useAuth();
const isAuthLock = computed(() => !isAuthenticated.value);

const handleWrapperClick = () => {
  if (isAuthLock.value) {
    openLoginModal();
  }
};
</script>

<template>
  <div
    @click="handleWrapperClick"
    role="button"
    :tabindex="isAuthLock ? 0 : -1"
    @keydown.enter="handleWrapperClick"
    class="auth-btn-wrapper interactive-element"
    :class="{ 'is-locked': isAuthLock }"
  >
    <slot />
  </div>
</template>

<style lang="scss">
.auth-btn-wrapper {
  position: relative;

  &.is-locked {
    cursor: pointer;
    z-index: 10;

    > * {
      pointer-events: none;
    }
  }
}
</style>
