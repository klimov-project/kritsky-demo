<script setup lang="ts">
interface BaseCheckboxProps {
  modelValue?: boolean
  label?: string
  disabled?: boolean
  id?: string
}

const props = withDefaults(defineProps<BaseCheckboxProps>(), {
  modelValue: false,
  label: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const checkboxId = computed(() => props.id || useId())
</script>

<template>
  <label
    :for="checkboxId"
    class="flex flex-row items-center gap-[10px] cursor-pointer select-none group"
    :class="{
      'opacity-60': !modelValue,
      'cursor-not-allowed opacity-50': disabled,
    }"
  >
    <div class="relative w-6 h-6 flex-shrink-0">
      <input
        :id="checkboxId"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="sr-only peer"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <div
        class="absolute inset-0 w-full h-full flex items-center justify-center rounded-[5px] border border-[var(--ui-border)] bg-[var(--ui-bg)] transition-all duration-200 peer-checked:border-[var(--ui-primary-bg)] group-hover:border-[var(--ui-border-accented)]"
        :class="{ 'peer-checked:border-[var(--ui-primary-bg)]': !disabled }"
      >
        <div
          class="w-[10px] h-[10px] rounded-full transition-all duration-200"
          :class="
            modelValue
              ? 'bg-[var(--ui-text)] scale-100'
              : 'bg-transparent scale-0'
          "
        ></div>
      </div>
    </div>
    <span
      v-if="label"
      class="text-sm font-normal leading-[1.1]"
      :style="{ color: 'var(--ui-text)' }"
    >
      {{ label }}
    </span>
    <span v-else class="text-sm font-normal leading-[1.1]">
      <slot name="label" />
    </span>
  </label>
</template>
