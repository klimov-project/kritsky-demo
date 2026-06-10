<script setup lang="ts">
const { hasOverflowHidden } = useLayout();
</script>

<template>
  <div
    :class="[
      'w-full min-h-screen flex flex-col relative',
      hasOverflowHidden ? 'bg-transparent z-10 overflow-hidden' : 'bg-default',
    ]"
  >
    <LayoutAppHeader />
    <LayoutMobileMenu />

    <slot />

    <LayoutAppFooter />
  </div>
</template>

<style scoped lang="scss">
.bg-default {
  background-color: var(--home-color-bg);
  position: relative;
}

.bg-default:before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 10;
  background: url('/periya-full-x2-compress.svg') repeat-y 0 159px / 100%;
  opacity: 0.015;
  pointer-events: none;
  display: none;
}
</style>
