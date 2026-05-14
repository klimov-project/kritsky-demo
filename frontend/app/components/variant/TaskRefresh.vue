<script setup lang="ts">
const props = defineProps<{
  blockBtns: boolean;
}>();

const isRefreshing = ref(false);

const isLocked = ref(false);

const isLoading = computed(() => {
  return props.blockBtns || isRefreshing.value;
});

async function handleRefresh() {
  isRefreshing.value = true;

  console.log('Имитация обновления ');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('обновлено ');

  isRefreshing.value = false;
}
</script>

<template>
  <button
    type="button"
    class="icon-button flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    :style="{
      color: 'var(--ui-text)',
      backgroundColor: isLoading ? 'transparent' : 'var(--ui-bg)',
    }"
    :aria-label="'Новый вариант задания'"
    :title="'Новый вариант задания'"
    :disabled="isLoading"
    @click="handleRefresh"
  >
    <!-- Иконка замка (если заблокировано) -->
    <IconLock v-if="isLocked && !isRefreshing" />

    <!-- Иконка обновления -->
    <IconRefresh
      v-else
      :class="{ 'animate-spin': isRefreshing }"
      @click="handleRefresh"
    />
  </button>
</template>

<style scoped lang="scss"></style>
