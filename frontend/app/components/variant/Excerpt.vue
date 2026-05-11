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
  <div class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px]">
    <VariantTasks1Header />
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

    <div class="pt-2 flex justify-between items-center text-gray-500 text-base">
      <span v-if="scene.hasNext"> {{ nextTitle }}</span>
      <span v-if="scene.hasPrevious"> {{ prevTitle }}</span>
    </div>
  </div>
</template>
