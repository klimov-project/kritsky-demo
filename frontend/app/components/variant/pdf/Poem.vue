<script setup lang="ts">
interface Props {
  poemTitle?: string;
  poemText?: string;
  poetName?: string;
}

const props = defineProps<Props>();

const singleColumnHtml = computed(() => {
  const headerBlock = `
    <h3 class="text-center text-base font-semibold text-xl">  
        «${props.poemTitle || ''}»
    </h3>
  `;

  const poemText =
    props.poemText || 'Текст стихотворения не загрузился, попробуйте ещё раз';

  const autorBlock = `
      <div class="flex justify-end mt-4">
        <p class="text-base font-semibold">
          ${props.poetName || ''}  
        </p>
      </div>
    `;

  return headerBlock + poemText + autorBlock;
});

const { settings } = useKnowledgeBase();
</script>
<template>
  <div class="pdf-section poem-section" data-section-name="poem">
    <VariantPdfTaskInstruction>
      {{ settings.variantTexts.part2Intro }}
    </VariantPdfTaskInstruction>

    <div v-html="singleColumnHtml" class="poem poem-sm max-w-none mb-4"></div>
  </div>
</template>
<style lang="scss">
.poem {
  padding-top: 20px;
}
</style>
