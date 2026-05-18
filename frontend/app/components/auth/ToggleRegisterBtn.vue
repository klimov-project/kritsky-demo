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
  <div class="text-center pt-3 mb-5">
    <button type="button" @click="toggleTab">
      <a rel="noopener noreferrer">
        {{ isLoginTab ? 'У меня нет аккаунта' : 'У меня есть аккаунт' }}
      </a>
    </button>
  </div>
</template>
