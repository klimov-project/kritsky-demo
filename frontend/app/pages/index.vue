<script setup lang="ts">
const { data: variantsCount } = await useFetch<number>('/api/variants-count');

console.log('variants-count raw data:', variantsCount.value);

const formattedCount = computed(() => {
  const count = variantsCount.value;

  if (!count || count === 0) return '1 000 000';

  return `${count
    .toLocaleString('ru-RU')
    .replace(/,/g, ' ')} вариантов заданий`;
});

const navigateToConstructor = () => {
  navigateTo('/new_test');
};
</script>

<template>
  <section
    class="flex-1 flex flex-col items-center justify-center py-[clamp(20px,4vh,36px)]"
  >
    <!-- Hero Wordmark -->
    <HeroWordmark />

    <!-- Features Desktop -->
    <div
      class="mt-[clamp(36px,5.6vh,56px)] lg:mt-[80px] max-w-[1125px] w-full hidden lg:grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center text-[#828282] text-[16px] leading-[1.22]"
    >
      <p class="max-w-[250px] justify-self-start">
        Профессиональный<br />конструктор ЕГЭ по литературе<br />для учителей и
        репетиторов
      </p>
      <span class="w-[1px] h-[57px] bg-[#cfcfcf] opacity-80"></span>
      <p class="max-w-[235px] justify-self-center text-center">
        База актуальных заданий,<br />более миллиона уникальных<br />авторских
        вариантов
      </p>
      <span class="w-[1px] h-[57px] bg-[#cfcfcf] opacity-80"></span>
      <p class="max-w-[232px] justify-self-end text-right">
        Мгновенная<br />подготовка материалов<br />к скачиванию и печати
      </p>
    </div>

    <!-- Features Mobile -->
    <div
      class="mt-[clamp(32px,5vh,52px)] lg:hidden flex flex-col items-center gap-[14px] text-[#828282] text-[clamp(14px,1.9vw,17px)] leading-[1.2] text-center"
    >
      <p class="max-w-[640px]">
        Профессиональный конструктор ЕГЭ по литературе для учителей и
        репетиторов
      </p>
      <span class="w-[min(70%,320px)] h-[1px] bg-[#cfcfcf] opacity-90"></span>
      <p class="max-w-[640px]">
        База актуальных заданий, более миллиона уникальных авторских вариантов
      </p>
      <span class="w-[min(70%,320px)] h-[1px] bg-[#cfcfcf] opacity-90"></span>
      <p class="max-w-[640px]">
        Мгновенная подготовка материалов к скачиванию и печати
      </p>
    </div>

    <!-- Actions -->
    <div
      class="mt-[clamp(30px,6vh,74px)] lg:mt-[80px] w-full flex flex-col lg:flex-row items-center justify-center gap-[14px]"
    >
      <button
        @click="navigateToConstructor"
        class="w-full lg:w-[216px] min-h-[50px] h-[60px] bg-[#bd5343] hover:bg-[#ab4a3c] text-white rounded-[50px] uppercase font-serif transition-colors"
      >
        Создать вариант
      </button>
      <div
        class="relative -left-[60px] -z-[1] pl-[70px] w-full lg:w-auto max-w-[653px] h-[60px] rounded-[50px] bg-white text-[#828282] text-[16px] flex items-center px-[34px] gap-[6px] whitespace-nowrap overflow-hidden border-none"
      >
        <span class="flex-shrink-0">Сейчас доступно:</span>
        <span class="overflow-hidden">
          {{ formattedCount }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes wordmark-in {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes decor-in {
  from {
    opacity: 0;
    transform: translateY(-22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes accent-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-wordmark-in {
  animation: wordmark-in 0.95s cubic-bezier(0.18, 0.9, 0.2, 1) both;
}
.animate-decor-in {
  animation: decor-in 0.95s cubic-bezier(0.18, 0.9, 0.2, 1) both;
}
.animate-accent-in {
  animation: accent-in 0.7s ease 0.45s forwards;
}
</style>
