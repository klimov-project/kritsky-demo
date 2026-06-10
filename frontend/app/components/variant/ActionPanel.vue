<script setup lang="ts">
interface FooterVariantProps {
  isDemo?: boolean;
}
withDefaults(defineProps<FooterVariantProps>(), {
  isDemo: false,
});
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between w-full bg-white rounded-[10px] p-[20px]"
  >
    <VariantPanelLayout :is-demo="isDemo" />
  </div>
</template>
