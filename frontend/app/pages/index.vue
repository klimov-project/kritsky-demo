<script setup lang="ts">
const { data: variantsCount } = await useFetch<{ count: number }>(
  '/api/variants-count',
);

console.log('variants-coun variantsCount', variantsCount.value);

const formattedCount = computed(() => {
  if (!variantsCount.value?.count) return '1 000 000';
  const count = variantsCount.value.count;
  if (count >= 1000000) return (count / 1000000).toFixed(1) + ' млн';
  if (count >= 1000) return (count / 1000).toFixed(1) + ' тыс';
  return count.toString();
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
    <div
      class="relative w-full max-w-[1125px] min-h-[clamp(190px,21vw,252px)] flex items-center justify-center"
    >
      <img
        src="/E.svg"
        alt=""
        class="absolute z-[3] w-[252px] h-auto top-[-70px] left-[228px] opacity-100 pointer-events-none animate-decor-in hidden lg:block"
        style="animation-delay: 0.08s;"
      />
      <img
        src="/GE.svg"
        alt=""
        class="absolute z-[1] w-[437px] h-auto top-[-74px] right-[243px] opacity-100 pointer-events-none animate-decor-in hidden lg:block"
        style="animation-delay: 0.15s;"
      />
      <div
        class="absolute z-[3] flex flex-row items-center justify-center w-full h-[77%] lg:hidden"
      >
        <img
          src="/E.svg"
          alt=""
          class="w-auto h-[70%] top-[-70px] opacity-100 pointer-events-none animate-decor-in"
          style="animation-delay: 0.08s;"
        />
        <img
          src="/GE.svg"
          alt=""
          class="w-auto h-[70%] top-[-74px] right-[243px] opacity-100 invisible pointer-events-none animate-decor-in"
          style="animation-delay: 0.15s;"
        />
      </div>
      <div
        class="absolute z-[0] flex flex-row items-center justify-center w-full h-[77%] lg:hidden"
      >
        <img
          src="/E.svg"
          alt=""
          class="w-auto h-[70%] top-[-70px] opacity-100 invisible pointer-events-none animate-decor-in"
          style="animation-delay: 0.08s;"
        />
        <img
          src="/GE.svg"
          alt=""
          class="w-auto h-[70%] top-[-74px] right-[243px] opacity-100 pointer-events-none animate-decor-in"
          style="animation-delay: 0.15s;"
        />
      </div>

      <img
        src="/hero_text_without_i.svg"
        alt="КРИЦКИЙ"
        class="relative z-[2] w-full h-auto animate-wordmark-in hidden lg:block"
      />
      <img
        src="/hero_text.svg"
        alt="КРИЦКИЙ"
        class="relative z-[2] w-full h-auto animate-wordmark-in lg:hidden"
      />
      <img
        src="/upper_i.svg"
        alt=""
        class="absolute right-[35px] top-0 w-[30px] h-auto z-[4] pointer-events-none opacity-0 animate-accent-in hidden lg:block"
      />
    </div>

    <!-- Features Desktop -->
    <div
      class="mt-[clamp(36px,5.6vh,56px)] w-full hidden lg:grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center text-[#828282] text-[16px] leading-[1.22]"
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
      class="mt-[clamp(30px,6vh,74px)] w-full flex flex-col lg:flex-row items-center justify-center gap-[14px]"
    >
      <button
        @click="navigateToConstructor"
        class="w-full lg:w-[216px] min-h-[50px] h-[60px] bg-[#bd5343] hover:bg-[#ab4a3c] text-white rounded-[50px] uppercase font-serif transition-colors"
      >
        Создать вариант
      </button>
      <div
        class="w-full lg:w-auto max-w-[653px] h-[60px] rounded-[50px] bg-white text-[#828282] text-[16px] flex items-center px-[34px] gap-[6px] whitespace-nowrap overflow-hidden border-none"
      >
        <span class="flex-shrink-0">Сейчас доступно:</span>
        <span
          class="text-[#333] text-[clamp(15px,1.45vw,21px)] overflow-hidden text-ellipsis"
          >{{ formattedCount }}</span
        >
        <span class="flex-shrink-1 overflow-hidden">вариантов заданий</span>
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
