<script setup>
const isOpen = ref(true);
</script>
<template>
  <div
    class="task-info relative rounded-[10px] p-[14px_40px] mb-[20px] min-h-[56px]"
    :style="{
      backgroundColor: 'var(--ui-primary-bg)',
    }"
  >
    <UCollapsible v-model:open="isOpen">
      <UButton
        class="icon-button flex-shrink-0 p-1 rounded-[5px] transition-all duration-200 hover:bg-[var(--ui-bg-elevated)] active:scale-95"
        trailing-icon="i-lucide-chevron-down"
        :style="{
          backgroundColor: 'var(--ui-bg)',
          color: 'var(--ui-button-text)',
        }"
      />

      <template #content>
        <p class="text-default text-xl leading-[23px] m-0">
          <slot />
        </p>
      </template>
    </UCollapsible>
  </div>
</template>
<style lang="scss">
.task-info {
  .icon-button {
    position: absolute;
    top: 14px;
    right: 20px;
  }

  [data-state='closed'] {
    [data-slot='trailingIcon'] {
      transform: rotate(180deg);
    }
  }
}
</style>
