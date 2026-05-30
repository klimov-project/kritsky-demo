<script setup lang="ts">
useHead({
  title: 'Конструктор вариантов ЕГЭ — Вариант недели',
  meta: [
    {
      name: 'description',
      content:
        'Генерируйте варианты ЕГЭ по литературным произведениям и стихам с помощью конструкторa от Kritsky Academy.',
    },
    {
      property: 'og:title',
      content: 'Вариант недели ЕГЭ | Kritsky Academy',
    },
    {
      property: 'og:description',
      content:
        'Вариант недели для демонстрации примера варианта ЕГЭ для подготовки: темы, отрывки и задания 1–16.',
    },
    { property: 'og:type', content: 'website' },
  ],
});
const { weeklyVariant } = useKnowledgeBase();
const { isInitialLoading } = useVariantState();
isInitialLoading.value = false;

const sentinelRef = ref<HTMLElement>();
const isEndOfPage = ref(false);
let observer;

onMounted(async () => {
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
  <div v-if="weeklyVariant" class="w-full max-w-[956px]">
    <VariantReadOnlyWeekly />

    <ClientOnly>
      <VariantPdfRender />
      <!-- <VariantFooter :is-demo="true" /> -->
    </ClientOnly>
  </div>

  <div ref="sentinelRef" class="h-px" />
  <VariantPanelFixed v-if="!isEndOfPage" :is-demo="true" />
</template>
