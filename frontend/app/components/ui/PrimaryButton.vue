<script setup lang="ts">
defineProps<{
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  trailingIcon?: string;
  type?: 'button' | 'submit';
}>();

defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    :type="type || 'button'"
    :disabled="disabled || loading"
    @click="$emit('click')"
    class="w-full h-[54px] rounded-[12px] font-medium uppercase text-sm transition-colors flex items-center justify-center gap-2 bg-[#1F1F1F] text-white hover:bg-black font-bold disabled:opacity-60"
  >
    <UIcon v-if="icon" :name="icon" class="w-5 h-5" />

    <slot />

    <UIcon v-if="trailingIcon" :name="trailingIcon" class="w-5 h-5" />
  </button>
</template>
