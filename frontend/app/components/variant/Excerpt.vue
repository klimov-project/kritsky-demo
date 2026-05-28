<script setup lang="ts">
interface Props {
  excerptText?: string;
  excerptAuthor?: string;
  excerptWork?: string;
  textColumns?: number;
  textSecondColumn?: string;
}

defineProps<Props>();
const {
  sceneNavigation: scene,
  navigateScene: navigate,
  nextTitle,
  prevTitle,
} = useNavigateScene();

const { settings } = useKnowledgeBase();
const { hasPrevious, hasNext } = scene.value;

const { isLocked } = useAuth();

const handleNav = (key: 'previous' | 'next') => {
  navigate(key);
};
</script>
<template>
  <div class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px_50px_30px]">
    <VariantTaskInstruction>
      {{ settings.variantTexts.part1Intro }}
    </VariantTaskInstruction>

    <div class="prose prose-sm max-w-none mb-4" v-if="textColumns !== 2">
      <p
        v-html="
          excerptText || 'Текст отрывка не загрузился, попробуйте ещё раз'
        "
      ></p>
    </div>
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
    </div>

    <div class="prose-nav pt-7 flex justify-between items-center">
      <BaseButton
        v-show="hasNext"
        :isLocked="isLocked"
        previous
        @click="handleNav('next')"
      >
        Предыдущая сцена
      </BaseButton>
      <div class="opacity-0"><span>_</span></div>
      <BaseButton
        v-show="hasPrevious"
        :isLocked="isLocked"
        next
        @click="handleNav('previous')"
      >
        Следующая сцена
      </BaseButton>
    </div>

    <div
      class="prose-nav pt-2 gap-2 flex justify-between items-center text-gray-500 text-base"
    >
      <span v-if="scene.hasNext" class="text-left"> {{ nextTitle }}</span>
      <span v-if="scene.hasPrevious" class="text-rigth"> {{ prevTitle }}</span>
    </div>
  </div>
</template>
<style lang="scss">
.prose {
  padding-top: 20px;

  &-nav {
    .text-rigth {
      margin-inline-start: auto;
    }
  }
}
</style>
