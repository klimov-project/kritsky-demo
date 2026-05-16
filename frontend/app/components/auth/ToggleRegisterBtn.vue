<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const isLoginTab = computed({
  get: () => (route.query.modal === 'register' ? false : true),
  set: (value: boolean) => {
    router.replace({
      path: route.path,
      query: { ...route.query, modal: value ? 'login' : 'register' },
    });
  },
});

const toggleTab = () => {
  isLoginTab.value = !isLoginTab.value;
};
</script>

<template>
  <div class="text-center pt-3">
    <button
      type="button"
      class="text-[#666] text-sm hover:text-gray-900 hover:underline transition-colors"
      @click="toggleTab"
    >
      {{ isLoginTab ? 'У меня нет аккаунта' : 'У меня есть аккаунт' }}
    </button>
  </div>
</template>
