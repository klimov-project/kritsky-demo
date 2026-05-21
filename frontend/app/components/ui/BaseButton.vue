<script setup lang="ts">
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  previous: {
    type: Boolean,
    default: false,
  },
  next: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: '',
  },
  trailingIcon: {
    type: String,
    default: '',
  },
});

defineEmits(['click']);

const computedIcon = computed(() => {
  if (props.icon) return props.icon;
  if (props.isLocked) return 'i-lucide:lock';
  if (props.previous) return 'i-lucide:arrow-left';
  return '';
});

const computedTrailingIcon = computed(() => {
  if (props.trailingIcon) return props.trailingIcon;
  if (props.next) return 'i-lucide:arrow-right';
  return '';
});
</script>

<template>
  <UButton
    @click="$emit('click')"
    :loading="loading"
    :disabled="disabled || loading"
    :icon="computedIcon"
    :trailing-icon="computedTrailingIcon"
    block
    size="lg"
    class="base-btn interactive-element w-auto h-[50px] whitespace-nowrap"
  >
    <slot />
  </UButton>
</template>

<style scoped lang="scss">
.base-btn {
  background-color: #f6f6f6;
  // font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ui-text);
  padding: 20px 35px 18px;
  border: none;
  box-shadow: none;
  border-radius: 10px;

  &:hover:not(:disabled) {
    background-color: #eeeeee;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
