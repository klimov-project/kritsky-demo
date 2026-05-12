<script setup lang="ts">
interface Props {
  excerptText?: string;
  excerptAuthor?: string;
  excerptWork?: string;
}

defineProps<Props>();
const {
  sceneNavigation: scene,
  navigateScene: navigate,
  nextTitle,
  prevTitle,
} = useNavigateScene();

const handleNav = (key: 'previous' | 'next') => {
  navigate(key);
};
</script>
<template>
  <div class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px_50px_30px]">
    <VariantTaskInstruction>
      Прочитайте приведённый ниже фрагмент художественного произведения и
      выполните задания 1–3, 4.1 или 4.2 (на выбор) и задание 5.
    </VariantTaskInstruction>

    <div class="prose prose-sm max-w-none mb-4">
      <p
        v-html="
          excerptText || 'Текст отрывка не загрузился, попробуйте ещё раз'
        "
      ></p>
    </div>
    <div class="flex justify-end">
      <p class="text-sm font-semibold text-gray-600">
        {{ excerptAuthor }} — «{{ excerptWork }}»
      </p>
    </div>

    <div class="pt-7 flex justify-between items-center">
      <BaseButton v-if="scene.hasNext" previous @click="handleNav('next')">
        Предыдущая сцена
      </BaseButton>

      <BaseButton v-if="scene.hasPrevious" next @click="handleNav('previous')">
        Следующая сцена
      </BaseButton>
    </div>

    <div
      class="pt-2 gap-2 flex justify-between items-center text-gray-500 text-base"
    >
      <span v-if="scene.hasNext" class="text-left"> {{ nextTitle }}</span>
      <span v-if="scene.hasPrevious" class="text-rigth"> {{ prevTitle }}</span>
    </div>
  </div>
</template>
