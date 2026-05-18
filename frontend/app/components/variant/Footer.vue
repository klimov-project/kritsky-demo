<script setup lang="ts">
defineProps<{
  blockBtns: boolean;
}>();

const { useSelected } = useVariantState();
const { generateVariant } = useGenerateVariant();

const generateWithSelected = async () => {
  useSelected.value = true;
  await generateVariant();
  useSelected.value = false;
};
const handleNav = (e: string) => console.log('click handle: ' + e);
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-[20px] gap-3">
      <WhiteButton
        icon="i-lucide-file"
        class="white-btn w-full h-[50px] whitespace-nowrap"
        :disabled="blockBtns"
        @click="generateVariant"
      >
        Новый рандомный вариант
      </WhiteButton>

      <WhiteButton
        icon="i-lucide-rotate-cw"
        class="white-btn w-full h-[50px] whitespace-nowrap"
        :disabled="blockBtns"
        @click="generateWithSelected"
      >
        Обновить все задания в варианте
      </WhiteButton>
    </div>
    <div v-if="false" class="flex items-center justify-between mb-3 gap-3">
      <WhiteButton previous @click="handleNav('next')" :disabled="blockBtns">
        Предыдущий вариант
      </WhiteButton>

      <WhiteButton next @click="handleNav('previous')" :disabled="blockBtns">
        Следующий вариант
      </WhiteButton>
    </div>
  </div>
</template>
