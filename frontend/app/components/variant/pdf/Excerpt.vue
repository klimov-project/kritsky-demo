<script setup lang="ts">
interface Props {
  part1Intro?: string;
  excerptText?: string;
  excerptAuthor?: string;
  excerptWork?: string;
  textColumns?: number;
  textSecondColumn?: string;
}

const props = defineProps<Props>();

const singleColumnHtml = computed(() => {
  const headerBlock = `
    <h1>Вариант 1</h1>
    <h2>Часть 1</h2>
    <div class="task-instruction-wrapper text-default ticket-pdf__task-description">
      <p class="task-instruction leading-[23px]">
        ${props.part1Intro || ''}
      </p>
    </div>
  `;

  const excerpt =
    props.excerptText || 'Текст отрывка не загрузился, попробуйте ещё раз';

  const autorBlock = `
      <div class="flex justify-end mt-4">
        <p class="text-base font-semibold">
          ${props.excerptAuthor || ''} — «${props.excerptWork || ''}»
        </p>
      </div>
    `;

  return headerBlock + excerpt + autorBlock;
});
</script>
<template>
  <div
    v-if="textColumns !== 2"
    v-html="singleColumnHtml"
    class="pdf-section two-page-excerpt prose"
    data-section-name="excerpt"
  ></div>

  <div
    v-else-if="textSecondColumn"
    class="pdf-section two-page-excerpt flex gap-8 mb-4"
    data-section-name="excerpt"
  >
    <div class="flex-1" v-html="excerptText"></div>
    <div class="flex-1 border-l pl-8" v-html="textSecondColumn"></div>
  </div>
</template>
<style lang="scss" scoped>
.prose {
  // padding-top: 20px;
  // font-size: 10px;
  // line-height: 2.1em;
}
</style>
