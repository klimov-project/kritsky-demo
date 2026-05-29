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
    props.textColumns === 2
      ? `
      <div class="flex gap-8 mb-4">
        <div class="flex-1"> ${props.excerptText || ''} </div>
        <div class="flex-1 border-l pl-8"> ${props?.textSecondColumn || ''}  
          </div>
      </div>`
      : props.excerptText || 'Текст отрывка не загрузился, попробуйте ещё раз';

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
    class="pdf-section two-page-excerpt prose"
    v-html="singleColumnHtml"
    data-section-name="excerpt"
  ></div>

  <div
    v-else-if="textSecondColumn"
    class="pdf-section two-page-excerpt "
    v-html="singleColumnHtml"
    data-section-name="excerpt"
  ></div>
</template>
<style lang="scss" scoped>
.prose {
  // padding-top: 20px;
  // font-size: 10px;
  // line-height: 2.1em;
}
</style>
