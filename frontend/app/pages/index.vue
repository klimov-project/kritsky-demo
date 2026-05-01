<script setup lang="ts">
// тест прегененрации подсчитанных вариантов
const { data: count, refresh, pending } = await useFetch(
  '/api/variants-count',
  {
    server: true,
    lazy: false,
  },
);

const formattedCount = computed(() => {
  if (count.value === undefined) return '...';
  return formatCompact(count.value);
});

// Фоновое обновление только если сервер доступен
onMounted(() => {
  const interval = setInterval(() => {
    refresh().catch(() => {
      // API недоступен (например, статический деплой без сервера)
      console.debug('API refreshing skipped (static mode)');
    });
  }, 30_000);

  onUnmounted(() => clearInterval(interval));
});

// Простейшая функция форматирования больших чисел
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
  <div class="page">
    <h1>Доступные варианты</h1>
    <p v-if="pending">Загрузка...</p>
    <p v-else class="counter">Примерное кол-во: {{ formattedCount }}</p>
    <button @click="refresh()">Обновить</button>
  </div>
</template>
