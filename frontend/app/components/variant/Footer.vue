<script setup lang="ts">
const handleNav = (e: string) => console.log('click handle: ' + e);
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-[20px] gap-3">
      <WhiteButton
        icon="i-lucide-file"
        class="white-btn w-full h-[50px] whitespace-nowrap"
        @click="handleNav('next')"
      >
        Новый рандомный вариант
      </WhiteButton>

      <WhiteButton
        icon="i-lucide-loader-circle"
        class="white-btn w-full h-[50px] whitespace-nowrap"
        @click="handleNav('next')"
      >
        Обновить все задания в варианте
      </WhiteButton>
    </div>
    <div class="flex items-center justify-between mb-3 gap-3">
      <WhiteButton previous @click="handleNav('next')">
        Предыдущий вариант
      </WhiteButton>

      <WhiteButton next @click="handleNav('previous')">
        Следующий вариант
      </WhiteButton>
    </div>
  </div>
</template>
