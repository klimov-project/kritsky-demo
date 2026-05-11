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

const { variant, isInitialLoading } = useVariantState();
const { pregenerateVariant } = useGenerateVariant();
// Initial fetch logic
onMounted(async () => {
  if (!variant.value) {
    await pregenerateVariant();
  }
  isInitialLoading.value = false;
});
</script>

<template>
  <div class="w-full max-w-[956px] text-[#333333] mt-8">
    <VariantCreateHeading />
  </div>
  <div class="relative min-h-screen w-full max-w-[956px]">
    <VariantCreate />
  </div>
</template>

<style>
.prose p {
  margin-bottom: 0.5rem;
}
</style>
