import type {
  TaskVariantHistory,
  CycleHistory,
  BlockBooleanFlags,
  TaskBooleanFlags,
  VariantExportQuota,
} from '@/types/variantTasks';

import {
  createEmptyTaskHistory,
  createEmptyCycleHistory,
  createBlockBooleanFlags,
  createTaskBooleanFlags,
} from '@/utils/variantUtils';

export const useVariantState = () => {
  
  const variant = useCurrentVariant();

  const taskHistory = useState<TaskVariantHistory>('variant-task-history', () =>
    createEmptyTaskHistory(),
  );
  const cycleHistory = useState<CycleHistory>('variant-cycle-history', () =>
    createEmptyCycleHistory(),
  );

  const refreshLoadingByBlock = useState<BlockBooleanFlags>(
    'variant-refresh-block-loading',
    () => createBlockBooleanFlags(false),
  );
  const refreshLoadingByTask = useState<TaskBooleanFlags>(
    'variant-refresh-task-loading',
    () => createTaskBooleanFlags(false),
  );
  const refreshDisabledByTask = useState<TaskBooleanFlags>(
    'variant-refresh-task-disabled',
    () => createTaskBooleanFlags(false),
  );

  const checkedAnswers = useState<Set<string>>(
    'variant-checked-answers',
    () => new Set(),
  );
  const collapsedTasks = useState<Set<string>>(
    'variant-collapsed-tasks',
    () => new Set(),
  );

  const statusMessage = useState<string>('variant-status-message', () => '');
  const exportQuota = useState<VariantExportQuota | null>(
    'variant-export-quota',
    () => null,
  );

  const isInitialLoading = useState<boolean>(
    'variant-initial-loading',
    () => true,
  );
  const isSaving = useState<boolean>('variant-saving', () => false);
  const isDownloadingPdf = useState<boolean>(
    'variant-downloading-pdf',
    () => false,
  );

  const selectedWorkId = useState<string>('variant-selected-work-id', () => '');
  const selectedExcerptId = useState<string>(
    'variant-selected-excerpt-id',
    () => '',
  );
  const selectedPoetId = useState<string>('variant-selected-poet-id', () => '');
  const selectedPoemId = useState<string>('variant-selected-poem-id', () => '');
  const selectedThemeId = useState<string>(
    'variant-selected-theme-id',
    () => '',
  );
  const selectedChapter = useState<string>(
    'variant-selected-chapter',
    () => '',
  );

  const useSelected = useState<boolean>('use-selected', () => false);

  // Free tier restrictions
  const task11Refreshes = useState<number>('variant-task11-refreshes', () => 0);
  const cachedPreGeneratedVariant = useState('variant-cached-pregenerated', () => null);
  const hasCachedPreGeneratedVariant = useState<boolean>(
    'variant-has-cached-pregenerated',
    () => false,
  );

  return {
    variant,
    taskHistory,
    cycleHistory,
    refreshLoadingByBlock,
    refreshLoadingByTask,
    refreshDisabledByTask,
    checkedAnswers,
    collapsedTasks,
    statusMessage,
    exportQuota,
    isInitialLoading,
    isSaving,
    isDownloadingPdf,
    selectedWorkId,
    selectedExcerptId,
    selectedPoetId,
    selectedPoemId,
    selectedThemeId,
    selectedChapter,
    useSelected,
    // Free tier
    task11Refreshes,
    cachedPreGeneratedVariant,
    hasCachedPreGeneratedVariant,
  };
};
