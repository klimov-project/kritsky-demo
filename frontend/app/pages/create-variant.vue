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
const variantsStore = useVariantsStore();
const isLoading = computed(() => variantsStore.isLoading);

const sentinelRef = ref<HTMLElement>();
const isEndOfPage = ref(false);
let observer;
// Initial fetch logic
onMounted(async () => {
  if (!variant.value) {
    const res = await pregenerateVariant();
    console.log('Pregenerate result:', res);

    isInitialLoading.value = false;
  }

  const threshold = 300;
  if (typeof window === 'undefined' || !sentinelRef.value) return;
  observer = new IntersectionObserver(
    ([entry]) => {
      isEndOfPage.value = entry.isIntersecting;
    },
    {
      rootMargin: `0px 0px ${threshold}px 0px`,
      threshold: 0,
    },
  );

  observer.observe(sentinelRef.value);
});
</script>

<template>
  <GlobalLoader v-if="isLoading" />

  <div class="w-full max-w-[956px] text-[#333333] mt-8">
    <VariantCreateHeading />
  </div>
  <div class="relative min-h-screen w-full max-w-[956px]">
    <VariantCreate />
  </div>

  <div ref="sentinelRef" class="h-px" />
  <VariantPanelFixed v-if="!isEndOfPage" />
</template>

<style></style>
