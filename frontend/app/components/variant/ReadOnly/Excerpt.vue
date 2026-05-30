<script setup lang="ts">
const { settings } = useKnowledgeBase();

// :excerpt-text="variant.excerpt?.text"
// :text-columns="variant.excerpt?.textColumns"
// :text-second-column="variant.excerpt?.textSecondColumn"
// :excerpt-author="variant.work?.author"
// :excerpt-work="variant.work?.title"
</script>
<template>
  <div class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px]">
    <VariantTaskInstruction>
      {{ settings.variantTexts.part1Intro }}
    </VariantTaskInstruction>
    <!-- 
    <div
      class="prose prose-sm max-w-none text-justify mb-4"
      v-if="textColumns !== 2"
      v-html="excerptText || 'Текст отрывка не загрузился, попробуйте ещё раз'"
    ></div>
    <div v-else class="flex gap-8 mb-4">
      <div class="prose prose-sm max-w-none flex-1">
        <p v-html="excerptText"></p>
      </div>
      <div
        v-if="textSecondColumn"
        class="prose prose-sm max-w-none flex-1 border-l pl-8"
      >
        <p v-html="textSecondColumn"></p>
      </div>
    </div>
    <div class="flex justify-end">
      <p class="text-base font-semibold text-gray-600">
        {{ excerptAuthor }} — «{{ excerptWork }}»
      </p>
    </div> -->
  </div>
</template>
<style lang="scss">
.prose {
  padding-top: 20px;

  &-nav {
    .text-rigth {
      margin-inline-start: auto;
    }
    & > span {
      max-width: 270px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
