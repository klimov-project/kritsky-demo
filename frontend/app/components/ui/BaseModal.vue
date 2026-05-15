<script setup lang="ts">
interface Props {
  title: string;
}

defineProps<Props>();

const isOpen = defineModel<boolean>({ required: true });
</script>
<template>
  <UModal v-model="isOpen">
    <UCard
      :ui="{
        base: 'relative bg-white rounded-[20px] shadow-lg w-[400px] max-w-full',
        body: { base: 'px-8 pt-0 pb-0' },
        header: { base: 'px-8 pt-8 pb-0' },
        footer: { base: 'px-8 pb-10 pt-0' },
      }"
    >
      <!-- Шапка с заголовком и крестиком -->
      <template #header>
        <div class="relative flex items-center justify-center">
          <h2 class="text-center font-semibold text-[#1F1F1F] text-[26px]">
            {{ title }}
          </h2>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            size="sm"
            class="absolute right-0 top-1/2 -translate-y-1/2"
            @click="isOpen = false"
          />
        </div>
      </template>

      <!-- Основной контент -->
      <div class="py-6 space-y-6">
        <slot />
      </div>

      <!-- Футер для кнопок -->
      <template #footer>
        <div class="space-y-3">
          <slot name="footer" />
        </div>
      </template>
    </UCard>
  </UModal>
</template>
