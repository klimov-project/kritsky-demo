# Button Behavior & State Guide

## Free Tier Restrictions System

### Button States Reference

```
UNAUTHENTICATED USER (Free Tier)
├── Constructor Panel Buttons (Footer.vue, Panel.vue)
│   ├── ✓ LOCKED: "Новый рандомный вариант" → showPaywall()
│   ├── ✓ LOCKED: "Обновить все задания в варианте" → showPaywall()
│   ├── ✓ LOCKED: "Скачать" → showPaywall()
│   ├── ✓ LOCKED: "Печать" → showPaywall()
│   ├── ✓ LOCKED: "Сохранить" → showPaywall()
│   └── ✓ LOCKED: "Поделиться" → showPaywall()
│
├── Variant Generation Buttons
│   ├── ✓ CACHED: "Новый вариант" (pregenerated)
│   └── ✓ ACTIVE: "Получить готовый вариант" (pregenerateVariant)
│
├── ExcerptFilters.vue
│   ├── ✓ ACTIVE: Work dropdown
│   ├── ✓ ACTIVE: Chapter dropdown
│   ├── ✓ LOCKED: Excerpt dropdown → isLocked → showPaywall()
│   └── ✓ LOCKED: "Обновить отрывок и задания 1–5" → showPaywall()
│
├── PoemFilters.vue
│   ├── ✓ ACTIVE: Poet dropdown
│   ├── ✓ LOCKED: Poem dropdown → isLocked → showPaywall()
│   ├── ✓ ACTIVE: Theme dropdown
│   └── ✓ LOCKED: "Обновить стихотворение и задания 6-10" → showPaywall()
│
├── Excerpt Navigation (Not yet implemented)
│   ├── ✓ LOCKED: "Предыдущая сцена" → showPaywall()
│   └── ✓ LOCKED: "Следующая сцена" → showPaywall()
│
├── Poem Navigation (Not yet implemented)
│   ├── ✓ LOCKED: "Предыдущее стихотворение" → showPaywall()
│   └── ✓ LOCKED: "Следующее стихотворение" → showPaywall()
│
├── Task Refresh Buttons (VariantTaskRefresh - Not yet implemented)
│   ├── For task11_* only:
│   │   ├── Max 3 refreshes per variant
│   │   ├── Counter tracked in task11Refreshes state
│   │   └── Button disabled after 3 refreshes
│   └── ✓ LOCKED: "Обновить задание" → showPaywall()
│
└── Task Previous Button (VariantTaskPrevious - Not yet implemented)
    └── ✓ INACTIVE: Only active if task was previously refreshed


AUTHENTICATED USER WITHOUT SUBSCRIPTION (Free w/ Account)
├── Panel Buttons (Footer.vue, Panel.vue)
│   ├── ✓ DISABLED: "Новый рандомный вариант"
│   ├── ✓ DISABLED: "Обновить все задания в варианте"
│   ├── ✓ DISABLED: "Скачать"
│   ├── ✓ DISABLED: "Печать"
│   ├── ✓ DISABLED: "Сохранить"
│   └── ✓ DISABLED: "Поделиться"
│
├── Filter Refresh Buttons
│   ├── ✓ DISABLED: "Обновить отрывок и задания 1–5"
│   ├── ✓ DISABLED: "Обновить стихотворение и задания 6-10"
│   └── ✓ DISABLED: "Обновить задания 11"
│
├── Navigation Buttons
│   ├── ✓ DISABLED: Excerpt navigation
│   └── ✓ DISABLED: Poem navigation
│
└── Task Refresh
    └── ✓ DISABLED: Individual task refresh


AUTHENTICATED USER WITH SUBSCRIPTION (isPro = true)
├── All buttons ACTIVE and functional
├── Panel buttons make API calls
├── Task11 refresh limited to 3 per variant
├── All navigation works
└── Full variant creation/refresh capabilities
```

## Implementation Checklist

### Footer Component (`app/components/variant/Footer.vue`)

- [x] Check `isAuthenticated` before generating variants
- [x] Show paywall when unauthenticated
- [x] Disable buttons for unauthenticated users
- [x] Call `refreshAllTasks()` for refresh all button

### Panel Component (`app/components/variant/Panel.vue`)

- [x] Require authentication for all buttons
- [x] Show paywall modal for unauthenticated clicks
- [x] Display subscription status in info section
- [x] Handle async operations with loading state

### ExcerptFilters Component (`app/components/variant/ExcerptFilters.vue`)

- [x] Lock excerpt dropdown for unauthenticated users (via isLocked)
- [x] Lock "Обновить отрывок..." button (via isLocked)
- [x] Show paywall when user tries to access locked elements

### PoemFilters Component (`app/components/variant/PoemFilters.vue`)

- [x] Lock poem dropdown for unauthenticated users (via isLocked)
- [x] Lock "Обновить стихотворение..." button (via isLocked)
- [x] Show paywall when user tries to access locked elements

### Missing Components (To Implement)

#### Excerpt Navigation (In Excerpt.vue)

```vue
<div class="flex gap-4">
  <BaseButton 
    @click="handleNavPrevious"
    :disabled="!isAuthenticated"
    v-show="hasPrevious"
  >
    Предыдущая сцена
  </BaseButton>
  <div class="opacity-0"><span>_</span></div>
  <BaseButton 
    @click="handleNavNext"
    :disabled="!isAuthenticated"
    v-show="hasNext"
  >
    Следующая сцена
  </BaseButton>
</div>

// In script: const handleNavPrevious = () => { if (!isAuthenticated.value) {
showPaywall() return } // Change selectedExcerptId and call
refreshBlock('block1') } const handleNavNext = () => { if
(!isAuthenticated.value) { showPaywall() return } // Change selectedExcerptId
and call refreshBlock('block1') }
```

#### Poem Navigation (In Poem.vue)

```vue
<div class="flex gap-4">
  <BaseButton 
    @click="handleNavPrevious"
    :disabled="!isAuthenticated"
    v-show="hasPrevious"
  >
    Предыдущее стихотворение
  </BaseButton>
  <div class="opacity-0"><span>_</span></div>
  <BaseButton 
    @click="handleNavNext"
    :disabled="!isAuthenticated"
    v-show="hasNext"
  >
    Следующее стихотворение
  </BaseButton>
</div>

// In script: const handleNavPrevious = () => { if (!isAuthenticated.value) {
showPaywall() return } // Change selectedPoemId and selectedPoetId, call
refreshBlock('block2') } const handleNavNext = () => { if
(!isAuthenticated.value) { showPaywall() return } // Change selectedPoemId and
selectedPoetId, call refreshBlock('block2') }
```

#### VariantTaskRefresh Component (New)

```vue
<script setup lang="ts">
defineProps<{
  taskKey: string;
  blockBtns: boolean;
}>();

const { isAuthenticated } = useAuth();
const { showPaywall } = useSubscription();
const { task11Refreshes } = useVariantState();
const { refreshTask } = useGenerateVariant();

const isTask11 = computed(() => taskKey.startsWith('task11_'));
const hasReachedLimit = computed(
  () => isTask11.value && task11Refreshes.value >= 3,
);

const handleRefresh = async () => {
  if (!isAuthenticated.value) {
    showPaywall();
    return;
  }

  if (hasReachedLimit.value) {
    // Show toast: "Достигнут максимум обновлений"
    return;
  }

  await refreshTask(taskKey);
};
</script>

<template>
  <BaseButton
    @click="handleRefresh"
    :disabled="blockBtns || !isAuthenticated || hasReachedLimit"
  >
    {{ hasReachedLimit ? 'Лимит исчерпан' : 'Обновить' }}
  </BaseButton>
</template>
```

#### VariantTaskPrevious Component (New)

```vue
<script setup lang="ts">
defineProps<{
  blockBtns: boolean;
  hasHistory: boolean; // True if task was previously refreshed
}>();

const { isAuthenticated } = useAuth();
const { showPaywall } = useSubscription();

const handlePrevious = () => {
  if (!isAuthenticated.value) {
    showPaywall();
    return;
  }
  // Rollback to previous task version
};
</script>

<template>
  <BaseButton
    @click="handlePrevious"
    :disabled="blockBtns || !isAuthenticated || !hasHistory"
  >
    К предыдущей версии
  </BaseButton>
</template>
```

## API Payload Building

### In useGenerateVariant.ts - buildPayload()

```typescript
const buildPayload = (includeTask1Filters = true) => {
  let task1Filters = {
    includeWorkQuestions: true,
    includeTermQuestions: true,
  };

  // Get task1 filter state from TermQuestionToggles
  if (includeTask1Filters) {
    const toggles = useTermQuestionToggles?.();
    if (toggles) {
      task1Filters = {
        includeWorkQuestions: toggles.includeWorkQuestions?.value ?? true,
        includeTermQuestions: toggles.includeTermQuestions?.value ?? true,
      };
    }
  }

  return {
    selectedWorkId: selectedWorkId.value,
    selectedExcerptId: selectedExcerptId.value,
    selectedPoetId: selectedPoetId.value,
    selectedPoemId: selectedPoemId.value,
    selectedThemeId: selectedThemeId.value,
    selectedBlock3AuthorId: '',
    task1Filters, // Only included when needed
  };
};
```

## Free User Caching Flow

```
1. User not authenticated → pregenerateVariant()
   ├── Check: !isAuthenticated && hasCachedPreGeneratedVariant
   │   └── Return cached variant ✓
   └── If no cache:
       ├── Fetch from /variants/runtime/pregenerated
       ├── Cache result in state
       └── Set hasCachedPreGeneratedVariant = true

2. Any refresh action on free user
   ├── showPaywall()
   └── No API call made

3. User logs in (isAuthenticated = true)
   ├── All cached state still available
   ├── All buttons become active
   └── Normal API flow resumes
```

## Task11 Refresh Counter

```
State: task11Refreshes (number, starts at 0)

On variant refresh:
  task11Refreshes = 0 // Reset for new variant

On task11_* refresh:
  ├── Check: task11Refreshes >= 3
  │   └── Skip API call, show "Лимит исчерпан"
  └── Otherwise:
      ├── Make API call
      └── task11Refreshes++
```
