<script setup lang="ts">
interface Props {
  excerptText?: string;
  excerptAuthor?: string;
  excerptWork?: string;
}

defineProps<Props>();
const scene = useNavigateScene();

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
    <div v-if="scene.hasNext">Следующая</div>
    <div v-if="scene.hasPrevious">Предыдущая</div>
  </div>
</template>
