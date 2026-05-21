<script setup lang="ts">
interface Props {
  poemTitle?: string;
  poemText?: string;
  poetName?: string;
}

defineProps<Props>();
</script>
<template>
  <div class="w-full bg-white rounded-[10px] mb-3 p-[30px_40px_50px_30px]">
    <VariantTaskInstruction>
      Прочитайте приведённое ниже художественное произведение и выполните
      задания 6–8, 9.1 или 9.2 (на выбор) и задание 10.
    </VariantTaskInstruction>

    <div class="poem poem-sm max-w-none mb-4">
      <h3 class="text-center text-base font-semibold text-xl leading-7">
        «{{ poemTitle }}»
      </h3>
    </div>
    <div class="poem poem-sm max-w-none mb-4">
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
