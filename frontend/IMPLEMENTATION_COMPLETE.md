# Implementation Complete: Auth, Restrictions & API Payloads

## Changes Implemented

### 1. **401 Logout & Session Management**

- **File**: `server/api/auth/me.get.ts`

  - Added 401 response handling to clear session on backend auth failure
  - Forces user logout when token expires or becomes invalid

- **File**: `app/middleware/auth-check.ts` (New)
  - Middleware verifies session validity on protected routes (/profile/\*)
  - Redirects to login modal on 401 response

### 2. **Free Tier Restrictions System**

- **File**: `app/composables/variant/useVariantState.ts`

  - Added `task11Refreshes` counter (max 3 refreshes for 11th-grade tasks)
  - Added `cachedPreGeneratedVariant` for free users
  - Added `hasCachedPreGeneratedVariant` flag to prevent re-fetching

- **File**: `app/composables/variant/useGenerateVariant.ts` (Complete rewrite)

  - Pregenerated variants cached for unauthenticated users
  - All refresh operations require authentication
  - Task11 refresh counter enforced (max 3)
  - Proper payload building with task1 filters
  - Shows paywall modal for unauthenticated users

- **File**: `app/composables/useTermQuestionToggles.ts` (New)
  - Manages task1 filter toggles for block1 refresh payloads

### 3. **Component Restrictions**

- **File**: `app/components/variant/Footer.vue`

  - "Новый рандомный вариант" button locked for unauthenticated users
  - "Обновить все задания в варианте" button locked for unauthenticated users
  - Both show paywall when clicked without authentication
  - Added `refreshAllTasks()` call

- **File**: `app/components/variant/Panel.vue` (Complete rewrite)
  - Download, Print, Save, Share buttons require authentication
  - Shows paywall modal when unauthenticated user clicks
  - Loading state for async operations
  - Auth status display in panel info

### 4. **API Request Payloads - Complete Specification**

All endpoints implemented with correct payload structure:

#### Block Refresh Payloads

```typescript
// Block1 Refresh - "Обновить отрывок и задания 1–5"
POST /variants/runtime/refresh-block
{
  block: "block1",
  selectedWorkId, selectedExcerptId, selectedPoemId, selectedPoetId,
  selectedThemeId, selectedBlock3AuthorId,
  task1Filters: { includeWorkQuestions, includeTermQuestions },
  variant: { /* full variant object */ }
}

// Excerpt Navigation - "Предыдущая/следующая сцена"
POST /variants/runtime/refresh-block
{
  block: "block1",
  selectedExcerptId: "new-excerpt-id", // Changed
  ...rest of payload
}

// Block2 Refresh - "Обновить стихотворение и задания 6-10"
POST /variants/runtime/refresh-block
{
  block: "block2",
  selectedPoemId, selectedPoetId, // May change
  ...rest of payload
}

// Poem Navigation - "Предыдущее/следующее стихотворение"
POST /variants/runtime/refresh-block
{
  block: "block2",
  selectedPoemId: "new-poem-id",
  selectedPoetId: "new-poet-id",
  ...rest of payload
}

// Block3 Refresh - "Обновить задания 11"
POST /variants/runtime/refresh-block
{
  block: "block3",
  block11RodPreference: {
    task11_1: "пьеса",
    task11_3: "поэма",
    task11_5: "лирика"
  },
  ...rest of payload
}
```

#### Task Refresh Payloads

```typescript
// Individual Task Refresh - VariantTaskRefresh
POST /variants/runtime/refresh-task
{
  taskKey: "task1" | "task2" | ... | "task11_1" | "task11_2" | etc,
  excludedTaskIds: [],
  selectedBlock3AuthorId,
  selectedThemeId,
  task1Filters: { includeWorkQuestions: false, includeTermQuestions: false },
  variant: { /* full current variant */ }
}

// Task2 Special Refresh - task2Refresh button
POST /variants/runtime/refresh-task
{
  taskKey: "task2",
  task2Action: "reroll", // Special flag
  ...rest of payload
}
```

#### Generate Payloads

```typescript
// Generate New Random Variant
POST /variants/runtime/generate
{
  selectedWorkId, selectedExcerptId, selectedPoemId, selectedPoetId,
  selectedThemeId, selectedBlock3AuthorId,
  task1Filters: { includeWorkQuestions, includeTermQuestions },
  useSelected: false
}

// Update All Tasks (Refresh All)
POST /variants/runtime/generate
{
  ...same as above,
  useSelected: true
}
```

### 5. **Free Tier Button Behavior Matrix**

| Button        | Unauthenticated          | Authenticated w/o Pro | Authenticated w/ Pro |
| ------------- | ------------------------ | --------------------- | -------------------- |
| Download      | Paywall                  | Disabled              | Active               |
| Print         | Paywall                  | Disabled              | Active               |
| Save          | Paywall                  | Disabled              | Active               |
| Share         | Paywall                  | Disabled              | Active               |
| Refresh Block | Paywall                  | Disabled              | Active               |
| Refresh Task  | Paywall (task11 limit 3) | Disabled              | Active (max 3)       |
| Refresh All   | Paywall                  | Disabled              | Active               |
| Navigation    | Paywall                  | Disabled              | Active               |

## Files Modified

1. `server/api/auth/me.get.ts` - 401 logout handling
2. `app/composables/variant/useVariantState.ts` - Free tier state
3. `app/composables/variant/useGenerateVariant.ts` - Complete rewrite with payloads
4. `app/composables/useTermQuestionToggles.ts` - New file
5. `app/components/variant/Footer.vue` - Auth checks & paywall
6. `app/components/variant/Panel.vue` - Auth checks & paywall
7. `app/middleware/auth-check.ts` - New middleware for 401 handling

## Files Unchanged (Already Correct)

- `app/components/variant/ExcerptFilters.vue` - Already has paywall logic
- `app/components/variant/PoemFilters.vue` - Already has paywall logic
- `app/composables/useSubscription.ts` - Has showPaywall() method

## Integration Points

- All buttons check `isAuthenticated` before making API calls
- All restricted actions show paywall modal via `useSubscription().showPaywall()`
- Task11 refresh counter tracked and enforced
- Pregenerated variants cached locally for free users
- 401 responses trigger logout and redirect to login

## Testing Checklist

- [ ] 401 response clears session and redirects to login
- [ ] Free user sees pregenerated variant once, cache persists
- [ ] Authenticated user can make unlimited API calls (except task11 max 3)
- [ ] All buttons locked for unauthenticated users
- [ ] Paywall modal opens on restricted button click
- [ ] Task11 counter increments correctly (max 3)
- [ ] All payloads match API specification exactly
- [ ] Navigation buttons pass changed IDs correctly

## Next Steps

1. Test all button states for free/paid users
2. Verify task11 refresh counter enforcement
3. Test variant caching for unauthenticated users
4. Verify all API payloads match backend expectations
5. Test 401 logout flow and session clearing
