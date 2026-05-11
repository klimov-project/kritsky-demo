<script setup lang="ts"></script>

<template>
  <aside
    class="hidden lg:block w-[250px] flex-shrink-0 absolute top-0 left-0 h-full -translate-x-full"
  >
    <div class="sticky top-12">
      <div class="bg-glass rounded-[10px] py-4 px-6 mr-5 mb-6">
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
      <div class="bg-glass rounded-[10px] py-4 px-7 mr-5">
        <a
          href="mailto:support@kritsky.academy"
          class="font-normal text-xs leading-[14px] tracking-[0.1em] uppercase text-[#333333] px-3 flex items-center gap-2"
        >
          <IconEmail />
          Обратная связь
        </a>
      </div>
    </div>
  </aside>
</template>
<style>
.bg-glass {
  /* background-color: rgb(255 255 255 / 55%); */
  background-color: rgb(255, 255, 255);
}
</style>
