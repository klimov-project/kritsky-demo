<script setup lang="ts">
defineProps<{
  label: string;
  placeholder?: string;
  type?: string;
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
  <div>
    <label
      class="block text-gray-400 text-[13px] font-medium uppercase tracking-wide mb-2"
    >
      {{ label }}
    </label>
    <UInput
      v-model="model"
      :placeholder="placeholder"
      :type="type || 'text'"
      class="w-full sm:px-5"
      :ui="{
        base: 'h-[54px] rounded-[12px] border-[#E5E5E5]',
      }"
    />
  </div>
</template>
