<script setup lang="ts"></script>

<template>
  <aside
    class="hidden lg:block w-[250px] flex-shrink-0 absolute top-0 right-0 h-full translate-x-full"
  >
    <div class="sticky top-12 bg-glass">
      <div class="hidden bg-white rounded-[10px] py-4 px-6 mr-5 mb-6">
        <button
          class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-sm"
        >
          Весь вариант
        </button>
        <button
          class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-sm"
        >
          Только отрывок
        </button>
        <button
          class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-gray-600 text-sm"
        >
          Только стихотворение
        </button>
      </div>
      <div class="bg-white rounded-[10px] py-4 px-7 ml-5">
        <a
          href="mailto:support@kritsky.academy"
          class="interactive-element font-normal text-xs leading-[14px] tracking-[0.1em] uppercase text-[#333333] px-3 flex items-center gap-2"
        >
          <IconEmail />
          Обратная связь
        </a>
      </div>
    </div>
  </aside>
</template>
<style lang="scss">
.bg-glass {
  &:after {
    content: '';
    position: absolute;
    top: -30px;
    left: 0;
    width: 100%;
    height: calc(100% + 60px);
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(246, 246, 246, 0.3) 15px,
      rgba(246, 246, 246, 0.7) 50px,
      rgba(246, 246, 246, 0.7) calc(100% - 50px),
      rgba(246, 246, 246, 0.3) calc(100% - 15px),
      transparent 100%
    );

    /* Блик по краям */
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.4),
      inset 0 -1px 1px rgba(255, 255, 255, 0.2);

    border: 0px solid;
    opacity: 1;
    z-index: -1;
    pointer-events: none;
  }
}
</style>
