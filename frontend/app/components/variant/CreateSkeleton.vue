<template>
  <div class="w-full max-w-[956px] text-[#333333] mt-8">
    <!-- Заголовок "Вариант 1" -->
    <div
      class="w-full bg-white rounded-[10px] flex justify-center items-center p-5 mb-3"
    >
      <USkeleton class="h-7 w-32" />
    </div>

    <!-- Подзаголовок "Часть 1" -->
    <div
      class="w-full bg-white rounded-[10px] flex justify-center items-center p-3 mb-3"
    >
      <USkeleton class="h-6 w-24" />
    </div>

    <!-- Панель фильтров -->
    <div class="w-full bg-white rounded-[10px] p-4 mb-3 space-y-3">
      <!-- Первая строка: 2 блока по 50% -->
      <div class="flex gap-3">
        <USkeleton class="h-10 flex-1" />
        <USkeleton class="h-10 flex-1" />
      </div>
      <!-- Вторая строка: 1 блок 100% -->
      <USkeleton class="h-10 w-full" />
      <!-- Третья строка: кнопка по центру -->
      <div class="flex justify-center pt-1">
        <USkeleton class="h-9 w-40" />
      </div>
    </div>

    <!-- Блок "Предисловие" — 3 строки текста -->
    <div class="w-full bg-white rounded-[10px] p-5 mb-3 space-y-2">
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-11/12" />
      <USkeleton class="h-4 w-4/5" />
    </div>

    <!-- Блок под много текста (документ/отрывок) -->
    <div class="w-full bg-white rounded-[10px] p-5 mb-3 space-y-2">
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-10/12" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-9/12" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-11/12" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-8/12" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-7/12" />
    </div>
  </div>
</template>
