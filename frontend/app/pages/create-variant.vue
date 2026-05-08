<script setup lang="ts">
useHead({
  title: 'Конструктор вариантов ЕГЭ — Создание варианта',
  meta: [
    {
      name: 'description',
      content:
        'Генерируйте варианты ЕГЭ по литературным произведениям и стихам с помощью конструкторa от Kritsky Academy.',
    },
    {
      property: 'og:title',
      content: 'Создание варианта ЕГЭ | Kritsky Academy',
    },
    {
      property: 'og:description',
      content:
        'Конструктор вариантов ЕГЭ для подготовки: темы, отрывки и задания 1–16.',
    },
    { property: 'og:type', content: 'website' },
  ],
});

const { kbStore, loadKnowledgeBase } = useKnowledgeBase();
if (import.meta.client && !kbStore.hasData) {
  loadKnowledgeBase().catch(() => {
    // Client-side fallback only, server-side loading is handled by the background plugin.
  });
}
</script>

<template>
  <div class="w-full max-w-[956px] text-[#333333] mt-7">
    <div
      class="w-full bg-white rounded-[10px] flex justify-center items-center p-5 mb-3"
    >
      <h1 class="font-normal text-2xl leading-7">Вариант 1</h1>
    </div>
    <div
      class="w-full bg-white rounded-[10px] flex justify-center items-center p-3 mb-3"
    >
      <h2 class="font-normal text-xl leading-7">Часть 1</h2>
    </div>
  </div>
  <div class="relative min-h-screen bg-gray-50 w-full max-w-[956px]">
    <VariantCreate />
  </div>
</template>

<style>
.prose p {
  margin-bottom: 0.5rem;
}
</style>
