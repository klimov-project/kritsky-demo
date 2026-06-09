<script setup lang="ts">
const { isAuthenticated } = useAuth();
const { editWeeklyVariant } = useGenerateVariant();

const handlePrint = () => {
  // if (!isAuthenticated.value) {
  //   showPaywall();
  //   return;
  // }
  // collectAllAnswers();
  // printVariant();
};
const open = ref(false);
</script>

<template>
  <div class="demo-panel flex flex-nowrap gap-3">
    <NuxtLink to="/weekly-variant.pdf" download="weekly-variant.pdf" external>
      <BaseButton icon="i-lucide-download">
        СКАЧАТЬ
      </BaseButton>
    </NuxtLink>

    <!-- <BaseButton icon="i-lucide-printer" @click="handlePrint">
      ПЕЧАТЬ
    </BaseButton> -->

    <UPopover v-model:open="open" arrow mode="hover">
      <PrimaryButton
        :disabled="!isAuthenticated"
        icon="i-lucide-edit"
        @click="editWeeklyVariant"
      >
        Изменить вариант
      </PrimaryButton>
      <template #content>
        <HoverPaywall v-if="!isAuthenticated" @click="open = false" />
      </template>
    </UPopover>
  </div>
</template>

<style lang="scss">
.demo-panel {
  .primary-btn {
    max-height: 50px;
  }
}
</style>
