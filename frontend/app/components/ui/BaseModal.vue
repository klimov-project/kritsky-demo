<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ close: [boolean] }>();

defineProps<{
  title?: string;
  description?: string;
  error?: string | null;
}>();
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description"
    :ui="{
      title: 'base-modal-title font-semibold text-default',
      content: 'base-modal overflow-visible',
      close: 'base-modal-close',
    }"
    :close="{
      onClick: () => emit('close', false),
    }"
    close-icon="i-lucide:circle-x size-full"
  >
    <button
      class="absolute -top-[100px] -right-[100px] text-gray-400 hover:text-gray-600"
      @click="emit('close', false)"
    >
      <UIcon name="i-lucide:circle-x" class="w-[30px] h-[30px]" />
    </button>

    <template #body>
      <slot />
      <UAlert
        v-if="error"
        class="bg-red-50 border border-red-200 rounded-sm p-4 flex items-start gap-3 mt-[20px]"
        icon="i-lucide:alert-circle"
        color="error"
        variant="soft"
        :title="error"
        :close-button="{ icon: 'i-lucide:x', color: 'error' }"
      />
    </template>

    <template #footer="{ close }">
      <div v-if="$slots.footer" class="space-y-3 w-full">
        <slot name="footer" :close="close" />
      </div>
    </template>
  </UModal>
</template>
<style lang="scss">
.base-modal {
  border: 0px solid;
  [data-slot='header'],
  [data-slot='body'],
  [data-slot='footer'] {
    border: 0px solid;
    margin-bottom: 30px;
  }
  [data-slot='header'] {
    padding: 57px 50px 0;
  }

  [data-slot='body'] {
    padding: 0 50px;
  }

  [data-slot='footer'] {
    padding: 0 50px;
  }
  .base-modal-close {
    position: absolute;
    top: -35px;
    right: -35px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: white !important;
    background-color: transparent !important;

    &:hover,
    &:active,
    &:focus {
      color: white !important;
      background-color: transparent !important;
    }
  }
  .base-modal-title {
    font-style: normal;
    font-weight: 400;
    font-size: 40px;
    line-height: 47px;
  }
}
</style>
