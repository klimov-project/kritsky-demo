<script setup lang="ts">
const { isLocked } = useAuth();
const { showPaywall } = useSubscription();

const handleWrapperClick = () => {
  showPaywall();
};
</script>

<template>
  <div
    @click="handleWrapperClick"
    role="button"
    :tabindex="isLocked ? 0 : -1"
    @keydown.enter="handleWrapperClick"
    class="auth-btn-wrapper interactive-element"
    :class="{ 'is-locked': isLocked }"
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
