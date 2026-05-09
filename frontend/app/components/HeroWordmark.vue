<template>
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
