<script setup lang="ts">
interface Props {
  poemTitle?: string;
  poemText?: string;
  poetName?: string;
}

defineProps<Props>();
const { settings } = useKnowledgeBase();
</script>
<template>
  <div class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px]">
    <VariantTaskInstruction>
      {{ settings.variantTexts.part2Intro }}
    </VariantTaskInstruction>

    <div class="poem poem-sm max-w-none text-justify mb-4">
      <h3 class="text-center text-base font-semibold text-xl leading-7">
        «{{ poemTitle }}»
      </h3>
    </div>
    <div class="poem poem-sm max-w-none text-justify mb-4">
      <p
        v-html="poemText || 'Стихотворение не загрузилось, попробуйте ещё раз'"
      ></p>
    </div>
    <div class="flex justify-end">
      <p class="text-base font-semibold text-gray-600">
        {{ poetName }}
      </p>
    </div>
  </div>
</template>
<style lang="scss">
.poem {
  padding-top: 20px;
}
</style>
