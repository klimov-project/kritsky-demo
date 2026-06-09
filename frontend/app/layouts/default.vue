<script setup lang="ts">
const { isVariantPage } = useLayout();

const zclass = computed(() =>
  isVariantPage.value ? 'z-5 no-interactive' : 'z-15',
);
</script>

<template>
  <LayoutPageWrapper>
    <main
      class="min-h-screen mx-auto max-w-[1440px] w-full px-3 lg:px-0 flex-1 flex flex-col flex items-center justify-center"
      :class="zclass"
    >
      <slot />
    </main>
  </LayoutPageWrapper>
</template>
