<script setup lang="ts">
interface VariantPanelProps {
  isDemo?: boolean;
}
withDefaults(defineProps<VariantPanelProps>(), {
  isDemo: false,
});

const { checkMe } = useAuth();
const variantsStore = useVariantsStore();
const isLoading = computed(() => variantsStore.isLoading);
onMounted(async () => {
  await checkMe();
});
</script>

<template>
  <div
    class="shadow-custom fixed z-100 bottom-0 max-w-[1440px] left-0 right-0 mx-auto w-full bg-white rounded-[10px_10px_0_0] shadow-sm"
  >
    <UProgress
      v-if="isLoading"
      animation="swing"
      size="sm"
      class="absolute top-0 left-0 right-0"
    />

    <div
      class="max-w-[1440px] mx-auto px-3 py-2 md:px-4 md:py-3 lg:px-8 lg:py-6"
    >
      <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 lg:gap-6"
      >
        <VariantPanelLayout :is-demo="isDemo" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.shadow-custom {
  box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.07);
}
</style>
