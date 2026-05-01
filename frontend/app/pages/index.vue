<script setup lang="ts">
const { data: count, refresh, pending } = await useFetch(
  '/api/variants-count',
  {
    server: true,
    lazy: false,
  },
);

const formattedCount = computed(() => {
  if (count.value === undefined || count.value === null) return '...';
  return formatCompact(Number(count.value));
});

function formatCompact(num: number): string {
  const suffixes = ['', 'тыс', 'млн', 'млрд', 'трлн'];
  let i = 0;
  while (num >= 1000 && i < suffixes.length - 1) {
    num /= 1000;
    i++;
  }
  return num.toFixed(i > 0 ? 1 : 0) + ' ' + suffixes[i];
}
</script>

<template>
  <div class="container mx-auto p-8 text-center">
    <h1 class="text-4xl font-bold mb-6">
      Конструктор вариантов ЕГЭ по литературе
    </h1>

    <div class="bg-white shadow-md rounded-lg p-8 max-w-md mx-auto mb-8">
      <h2 class="text-xl mb-4">Доступные уникальные варианты</h2>
      <div v-if="pending" class="text-2xl animate-pulse">Загрузка...</div>
      <div v-else class="text-4xl font-mono font-bold text-blue-600 mb-4">
        {{ formattedCount }}
      </div>
      <p class="text-gray-600 text-sm mb-6">
        Система генерирует варианты на основе актуальной базы заданий.
      </p>

      <NuxtLink
        to="/public-variant"
        class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition"
      >
        Сгенерировать вариант
      </NuxtLink>
    </div>

    <div class="text-sm text-gray-500">
      <NuxtLink to="/admin" class="hover:underline">Панель управления</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
}
</style>
