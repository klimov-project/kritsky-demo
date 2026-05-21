<script setup lang="ts">
const props = defineProps<{
  blockBtns: boolean;
  task: string;
}>();

const { refreshTask } = useGenerateVariant();
// const { task11Refreshes } = useVariantState();
const { isLocked } = useAuth();

const isRefreshing = ref(false);

// const isLockedLocal = computed(
//   () =>
//     (task11Refreshes.value >= 3 || !props.task.startsWith('11')) &&
//     isLocked.value,
// );

const isLockedLocal = computed(() => isLocked.value);

const isLoading = computed(() => {
  return props.blockBtns || isRefreshing.value;
});

async function handleRefresh() {
  isRefreshing.value = true;
  await refreshTask(props.task);
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
    <IconLock v-if="isLockedLocal && !isRefreshing" />

    <!-- Иконка обновления -->
    <IconRefresh v-else :class="{ 'animate-spin': isRefreshing }" />
  </button>
</template>

<style scoped lang="scss"></style>
