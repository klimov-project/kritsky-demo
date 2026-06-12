<script setup lang="ts"></script>

<template>
  <LayoutPageWrapper>
    <div
      class="relative mx-auto max-w-[1440px] w-full px-4 lg:px-6 py-6 lg:py-8"
    >
      <div
        class="row text-center font-normal text-4xl leading-[42px] mb-[32px]"
      >
        <h1>Личный кабинет</h1>
      </div>

      <div
        class="grid grid-cols-1 lg:grid-cols-[270px_minmax(auto,1fr)_270px] gap-5"
      >
        <ProfileSidebar active-item="profile" />

        <main class="min-w-0 bg-white rounded-[10px] p-5 lg:p-6">
          <slot />
        </main>

        <!-- Правая колонка (пустая для симметрии) -->
        <div class="hidden lg:block"></div>
      </div>
    </div>
  </LayoutPageWrapper>
</template>
<style>
.cool_style {
  text-align: right;
}
</style>
