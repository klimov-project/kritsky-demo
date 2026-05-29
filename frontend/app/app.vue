<script setup lang="ts">
import { ToastProvider, TooltipProvider } from 'reka-ui';
</script>

<template>
  <ToastProvider>
    <TooltipProvider :delay-duration="800" :skip-delay-duration="500">
      <NuxtLayout>

        <NuxtPage />

        <AuthModal />
        <ModalPaywall />
        
      </NuxtLayout>
    </TooltipProvider>
  </ToastProvider>
</template>
