# Refactor Plan: `src/app/new_test/page.tsx`

## Overview

The original `src/app/new_test/page.tsx` was a 5 225-line monolithic `'use client'` file containing types, constants, pure utility functions, React state/effects/callbacks, and JSX all mixed together. This document records the completed decomposition into properly separated modules.

## Status: COMPLETE ✓

Build passes cleanly: `npm run build` — 0 TypeScript errors, all 30 pages generated.

---

## Module Breakdown

### Step 1 — Types → `src/types/ui/newTest.ts`

Extracted 9 exported type definitions:

| Type | Description |
|---|---|
| `Task2PropertyCategory` | `'phrases' \| 'characteristics'` |
| `Task2RuntimeExclusions` | `{ characters: Set<string>; properties: Set<string> }` |
| `VariantTaskKey` | Union of all task keys (`task1` … `task11_5`) |
| `TaskVariantHistory` | `Record<VariantTaskKey, GeneratedVariant[]>` |
| `CycleHistory` | `Record<VariantTaskKey, string[]>` |
| `TaskBooleanFlags` | `Record<VariantTaskKey, boolean>` |
| `BlockBooleanFlags` | `Record<RuntimeVariantBlockKey, boolean>` |
| `VariantTaskEntry` | `{ key, value, fallbackAuthorId? }` |
| `ActivatableEntry` | `{ isActive?: boolean }` |

Imports: `GeneratedVariant` from `@/types/testVariant`, `RuntimeVariantBlockKey` from `@/lib/variantsApi`.

---

### Step 2 — Constants → `src/consts/newTest.ts`

Extracted 19 exported constants:

| Constant | Value |
|---|---|
| `RUSSIAN_LETTERS` | Cyrillic uppercase alphabet array |
| `VARIANT_BUILD_ATTEMPTS` | `600` |
| `SUPPORT_EMAIL` | `process.env.NEXT_PUBLIC_SUPPORT_EMAIL \|\| 'admin@kritsky.local'` |
| `TASK2_EXTRA_OPTION_FALLBACK` | Fallback string for Task 2 extra option |
| `TASK2_PAIR_PICK_ATTEMPTS` | `32` |
| `SERVICE_TAGS` | Set of Russian service tag words |
| `ROD_SINGLE_USE_IN_BLOCK11` | Set: `['лирика', 'пьеса', 'поэма']` |
| `NO_AUTHOR_TAGS` | Set of no-author tag variants |
| `BLOCK11_KEYS` | `['task11_1', …, 'task11_5'] as const` |
| `THEME_GROUP_1_KEYS` | `['task4_1', 'task4_2', 'task5'] as const` |
| `THEME_GROUP_2_KEYS` | `['task9_1', 'task9_2', 'task10'] as const` |
| `THEME_GROUP_3_KEYS` | `['task11_1', …, 'task11_5'] as const` |
| `SERVICE_TAG_ALLOWED_KEYS` | Set: `['task3', 'task6']` |
| `CHARACTER_TAG_ALLOWED_KEYS` | Set of task keys that allow character tags |
| `HTML_TAG_PATTERN` | Regex for detecting HTML markup |
| `TASK8_MAX_OPTIONS` | `7` |
| `TASK8_MIN_CORRECT_OPTIONS` | `2` |
| `TASK8_MAX_CORRECT_OPTIONS` | `6` |
| `VARIANT_TASK_KEYS` | `VariantTaskKey[]` ordered array |

Imports: `VariantTaskKey` from `@/types/ui/newTest`.

---

### Step 3 — Utility Functions → `src/utils/newTest.ts`

All pure (non-React) functions. Key exports:

**Tag & text helpers**
- `hasHtmlMarkup(text)` — detects HTML in a string
- `normalizeNbspText(text)` — replaces `&nbsp;` / `\u00a0`
- `extractTokens(text)` — tokenizes text for duplicate detection
- `extractServiceTags(text, taskKey)` — returns service tag tokens
- `extractCharacterTags(text, taskKey)` — returns character tag tokens
- `computeVariantTokens(variant, taskKey)` — full token set for a variant
- `isTooSimilar(a, b)` — Jaccard similarity check (threshold 0.6)
- `isNoFurtherVariantsMessage(text)` — detects exhaustion placeholder

**Cycle & deduplication**
- `updateCycleHistory(history, key, tokens)` — append/trim token history
- `isInCycleHistory(history, key, tokens)` — check token overlap

**Task-specific builders**
- `buildTask2ExtraOption(pools, exclusions)` — picks "none of the above" option
- `buildTask2Pair(pools, exclusions, attempts)` — character/property pair for Task 2
- `buildTask1Filters(work, defaultFilters)` — merges work-level Task 1 filters
- `pickBlock3Pair(questions, usedIds)` — picks 2 distinct Block 3 questions
- `pickTwoDistinctBlock3Questions` — alias of `pickBlock3Pair`
- `sortExcerptsByOrder(excerpts)` — stable sort by `.order`
- `getTask2AnswerMap(task2, russianLetters)` — generates answer display map
- `getTask2RightOptions(task2)` — extracts correct-answer strings
- `getTask8CorrectOptionNumbers(task8)` — correct option indices for Task 8

**Variant evaluation**
- `evaluateVariant(variant, history, cycleHistory)` — scores a variant for quality
- `computeThemeGroupDiversity(variant)` — checks theme variety across groups

**Admin helpers**
- `buildRuntimeTwoGapTask(base, pools)` — builds a runtime two-gap task object
- `findTaskByIdInPools(id, pools, taskType)` — searches material pools by task ID

---

### Step 4 — Hook → `src/hooks/useNewTestPage.ts`

All React state, effects, memos, and callbacks. Marked `'use client'`.

**Local helpers** (private to the hook file, tightly coupled to async closure logic):
- `getRodLabel(rodId?)` — maps rod ID to a display string
- `extractBlock11RodMap(variant)` — reads current rod assignments from a variant
- `rotateBlock11Rods(currentMap)` — cycles each rod to the next literary form
- `computePinAwareBlock11RodPreference(...)` — respects pinned tasks during rotation
- `restorePinnedTasksFrom(draft, pinned, canonical)` — merges pinned tasks back into a new variant

**Returned state & handlers** (partial list):
- `variant`, `setVariant` — current generated variant
- `isLoading`, `isGenerating` — loading/generating flags
- `pinned`, `togglePin` — per-task pin management
- `showSelectModal`, `handleOpenSelect`, `handleCancelSelect`, `handleConfirmSelect` — admin "select by ID" modal
- `selectedWork`, `excerpts`, `poets`, `poems`, `themes` — memos
- `handleRefreshTask`, `handleRefreshBlock11`, `handleGenerateVariant` — regeneration handlers
- `handleSave`, `handleDownload`, `handlePrint` — export handlers
- `exportQuota`, `isSaving`, `isSaved` — quota and save state
- Navigation refs and scene/poem nav helpers

---

### Step 5 — Page (thin wrapper) → `src/app/new_test/page.tsx`

Reduced from 5 225 lines to ~800 lines. The page component:

1. Calls `useNewTestPage()` to get all state and handlers
2. Keeps small local UI components that are purely presentational and page-specific:
   - `SelectField` — generic form select
   - `RichTextBlock` — renders HTML or plain text
   - `CollapsibleInstruction` — expand/collapse instruction panel
   - `QuestionNumberBadge` — styled task number badge
   - `QuestionActions` — pin + refresh buttons row
   - `DockButton` — bottom dock action button
   - `TestVariantSkeleton` — loading skeleton
   - `AdminIdBadge`, `AdminTaskMeta` — admin debug overlays
   - `getRodLabel`, `getTagsList` — tiny render helpers (not React components)
3. Renders the full exam variant UI using destructured hook return values

---

## Dependency Graph

```
@/types/testVariant          @/lib/variantsApi
        ↓                           ↓
@/types/ui/newTest  ←———————————————┘
        ↓
@/consts/newTest
        ↓
@/utils/newTest  ←——— @/mocks/materials
        ↓
@/hooks/useNewTestPage  ←——— @/context/AuthContext
        ↓                    @/store/freeTierStore
@/app/new_test/page.tsx      @/lib/variantsApi
                             @/utils/savedVariants
```

No circular dependencies.

---

## Key Behavioral Changes

1. **`getTask2AnswerMap` signature**: Now accepts `russianLetters: string[]` as a second parameter instead of importing `RUSSIAN_LETTERS` directly, making the function more testable. Call sites pass the constant explicitly.

2. **`buildRuntimeTwoGapTask` and `findTaskByIdInPools`**: Originally inlined inside `handleConfirmSelect`. Extracted to `src/utils/newTest.ts` as pure functions.

3. **`getRodLabel`**: Kept as a local helper inside `src/hooks/useNewTestPage.ts` (not exported from utils) because it is only needed for the hook's admin debug path.

4. **Block11 rotation helpers**: `extractBlock11RodMap`, `rotateBlock11Rods`, `computePinAwareBlock11RodPreference`, `restorePinnedTasksFrom` kept local to the hook since they operate on the hook's mutable state and are tightly coupled to the async generation closure.
