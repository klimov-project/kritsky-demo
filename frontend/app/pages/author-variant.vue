<script setup lang="ts">
const { pending, error, refresh, variantsCount, store } = useKnowledgeBase();
</script>

<template>
  <div class="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
    <pre>
        pending {{ pending }},
        error {{ error }},
        refresh {{ refresh }},
        variantsCount: {{ variantsCount }},
        store: {{ store }},
    </pre>
  </div>
</template>

<style></style>
