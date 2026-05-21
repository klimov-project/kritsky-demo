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
const sentinelRef = ref<HTMLElement>();
const isEndOfPage = ref(false);
const threshold = 300;
// Initial fetch logic
onMounted(async () => {
  if (!variant.value) {
    await pregenerateVariant();
  }
  isInitialLoading.value = false;

  if (typeof window === 'undefined' || !sentinelRef.value) return;
  const observer = new IntersectionObserver(
    ([entry]) => {
      isEndOfPage.value = entry.isIntersecting;
    },
    {
      rootMargin: `0px 0px ${threshold}px 0px`,
      threshold: 0,
    },
  );

  observer.observe(sentinelRef.value);

  onUnmounted(() => observer.disconnect());
});
</script>

<template>
  <div class="w-full max-w-[956px] text-[#333333] mt-8">
    <VariantCreateHeading />
  </div>
  <div class="relative min-h-screen w-full max-w-[956px]">
    <VariantCreate />
  </div>

  <div ref="sentinelRef" class="h-px" />
  <VariantPanel v-if="!isEndOfPage" />
</template>

<style>
.prose p {
  margin-bottom: 0.5rem;
}
</style>
