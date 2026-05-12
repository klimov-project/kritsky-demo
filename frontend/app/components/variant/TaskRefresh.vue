<script setup lang="ts">
const isLocked = ref(false);
const clickRefresh = () => {
  console.log('clickRefresh');
};
</script>

<template>
  <button
    type="button"
    class="icon-button flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    :style="{
      color: 'var(--ui-text)',
      backgroundColor: 'var(--ui-bg)',
    }"
    :aria-label="'Новый вариант задания'"
    :title="'Новый вариант задания'"
  >
    <!-- <button
    type="button"
    class="icon-button flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-[5px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    :style="{
      color: 'var(--ui-text)',
      backgroundColor:
        disableRefresh || isRefreshing ? 'transparent' : 'var(--ui-bg)',
    }"
    :aria-label="'Новый вариант задания'"
    :title="'Новый вариант задания'"
    :disabled="disableRefresh || isRefreshing"
    @click="handleRefresh"
  > -->
    <!-- Иконка замка (если заблокировано) -->
    <!-- <IconLock v-if="isLocked && !isRefreshing" />  -->
    <IconLock v-if="isLocked" />

    <!-- Иконка обновления -->
    <!-- <IconRefresh :class="{ 'animate-spin': isRefreshing }" /> -->
    <IconRefresh v-else @click="clickRefresh" />
  </button>
</template>

<style scoped lang="scss"></style>
