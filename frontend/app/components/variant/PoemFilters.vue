<script setup lang="ts">
interface Props {
  selectedPoetId: string
  selectedPoemId: string
  selectedThemeId: string
  isLoading: boolean
}

const props = defineProps<Props>()

const {
  availablePoets,
  availablePoems
} = usePoem();

const { themes } = useKnowledgeBase();
const { isLocked } = useAuth();

const isLockIcon = computed(()=> isLocked.value ? "i-lucide:lock" : '')

const poetsOptions = computed(() => {
  return availablePoets.value?.map(poet => ({
    label: poet.name,
    value: poet.id
  })) || [];
});

const poemsOptions = computed(() => {
  return availablePoems.value?.map(poem => ({
    label: poem.title,
    value: poem.id,
  })) || [];
});


const emit = defineEmits<{
  'update:selected-poet-id': [value: string]
  'update:selected-poem-id': [value: string]
  'update:selected-theme-id': [value: string]
  'refresh-block-2': []
}>()

const selectedPoetId = computed({
  get: () => props.selectedPoetId,
  set: (value) => emit('update:selected-poet-id', value)
})

const selectedPoemId = computed({
  get: () => props.selectedPoemId,
  set: (value) => emit('update:selected-poem-id', value)
})

const selectedThemeId = computed({
  get: () => props.selectedThemeId,
  set: (value) => emit('update:selected-theme-id', value)
})

const disabledPoets = computed(() => poetsOptions.value.length === 0)
const disabledPoems = computed(() => poemsOptions.value.length === 0)
</script>

<template>
  <div class="create-variant-filters p-6 rounded-lg">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="w-full">
        <label
          class="block text-base font-medium uppercase tracking-wider mb-2 text-toned"
        >
          Автор
        </label>
        <USelect
          v-model="selectedPoetId"
          :items="poetsOptions"
          :disabled="disabledPoets"
          placeholder="Выберите автора"
          class="w-full"
        />
      </div>

      <div>
        <label
          class="block text-base font-medium text-toned uppercase tracking-wider mb-2"
        >
          Стихотворение
        </label>

        <AuthBtnWrap>
          <USelect
            v-model="selectedPoemId"
            :items="poemsOptions"
            :disabled="disabledPoems"
            :icon="isLockIcon"
            placeholder="Выберите стихотворение"
            class="w-full"
          />
        </AuthBtnWrap>
      </div>
      <div
        class="md:col-span-2 flex flex-row items-center justify-center text-base font-medium text-toned uppercase tracking-wider"
      >
        ИЛИ
      </div>
      <div class="md:col-span-2">
        <label
          class="block text-base font-medium text-toned uppercase tracking-wider mb-2"
        >
          Тема
        </label>
        <USelect
          v-model="selectedThemeId"
          :items="themes"
          placeholder="Выберите тему"
          class="w-full"
        />
      </div>
    </div>

    <!-- Отладочная информация -->
    <div v-if="false" class="mt-4 text-base text-gray-500">
      <div>Всего поэтов: {{ poetsOptions.length }}</div>
      <div>Выбранный поэт: {{ selectedPoetId }}</div>
      <div>Всего стихотворений: {{ poemsOptions.length }}</div>
      <div>Выбранное стихотворение: {{ selectedPoemId }}</div>
    </div>

    <div class="pt-7 flex justify-center items-center">
      <BaseButton
        @click="$emit('refresh-block-2')"
        :loading="isLoading"
        :disabled="isLoading"
        class="update-variant-btn__filter"
        :isLocked="isLocked"
      >
        Обновить стихотворение и задания 6-10
      </BaseButton>
    </div>
  </div>
</template>
<style lang="scss">
.create-variant-filters {
  button[data-slot='base']:not(.update-variant-btn__filter) {
    --tw-ring-color: #cfcfcf;
    padding: 15px 24px;
    background-color: #ffffff;
    border-radius: 10px;
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 19px;
  }
}
</style>
