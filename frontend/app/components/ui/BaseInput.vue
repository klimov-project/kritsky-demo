<script setup lang="ts">
defineProps<{
  label: string;
  placeholder?: string;
  type?: string;
}>();

const model = defineModel<string>({ required: true });

const id = useId();
</script>

<template>
  <div class="base-input w-full">
    <label
      :for="id"
      class="block text-base font-medium uppercase tracking-wider mb-2 text-toned"
    >
      {{ label }}
    </label>
    <UInput
      :id="id"
      v-model="model"
      :placeholder="placeholder"
      :type="type || 'text'"
      class="w-full"
      :ui="{
        base: ' ',
      }"
    />
  </div>
</template>

<style lang="scss">
.base-input {
  input[data-slot='base'] {
    --tw-ring-color: #cfcfcf;
    padding: 15px 24px;
    background-color: #ffffff;
    border-radius: 10px;
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 20px;
  }
}
</style>
