'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { FREE_TIER_LIMITS, useFreeTierStore } from '@/store/freeTierStore';
import { fetchKnowledgeBase, saveWeeklyPins, setWeeklyVariant } from '@/lib/knowledgeBaseApi';
import { downloadElementAsPdf } from '@/lib/pdfDownload';
import type {
    Block3Data,
    Excerpt,
    KnowledgeBaseSettings,
    Poem,
    Poet,
    Work,
} from '@/mocks/materials';
import { DEFAULT_KNOWLEDGE_BASE_SETTINGS } from '@/mocks/materials';
import type { GeneratedVariant, Task1Filters } from '@/types/testVariant';
import { DEFAULT_TASK1_FILTERS } from '@/utils/savedVariants';
import {
    consumeVariantExportQuota,
    generateRuntimeVariantV2,
    getPregeneratedVariantV2,
    getVariantExportQuota,
    refreshRuntimeVariantBlockV2,
    refreshRuntimeVariantTaskV2,
    saveVariant,
    type RuntimeVariantBlockKey,
    type RuntimeVariantTaskKey,
    type VariantExportQuota,
} from '@/lib/variantsApi';
import type {
    BlockBooleanFlags,
    CycleHistory,
    TaskBooleanFlags,
    TaskVariantHistory,
    VariantTaskKey,
} from '@/types/ui/newTest';
import { BLOCK11_KEYS, RUSSIAN_LETTERS, SUPPORT_EMAIL } from '@/consts/newTest';
import {
    buildRuntimeTwoGapTask,
    createBlockBooleanFlags,
    createEmptyCycleHistory,
    createEmptyTaskHistory,
    createTaskBooleanFlags,
    evaluateVariantRules,
    extractAuthorTokens,
    extractRodTokens,
    extractThemeTokens,
    filterActiveItems,
    findTaskByIdInPools,
    getEntityThemeTokens,
    isBetterEvaluation,
    isNoFurtherVariantsMessage,
    parseIdentifierTokens,
    sortExcerptsByOrder,
} from '@/utils/newTest';

function getRodLabel(rodId?: string): string | null {
    if (!rodId) return null;
    const n = rodId.toLowerCase();
    if (n.includes('лирик')) return 'лирика';
    if (n.includes('пьес')) return 'пьеса';
    if (n.includes('поэм')) return 'поэма';
    if (n.includes('проз')) return 'проза';
    return rodId;
}

function extractBlock11RodMap(variant: GeneratedVariant): Record<string, string> {
    const map: Record<string, string> = {};
    for (const key of BLOCK11_KEYS) {
        const task = (variant as unknown as Record<string, unknown>)[key];
        if (!task) continue;
        const rodTokens = extractRodTokens(task);
        const specialRod = rodTokens.find((rod) => ['лирика', 'пьеса', 'поэма'].includes(rod));
        if (specialRod) {
            map[key] = specialRod;
        }
    }
    return map;
}

function rotateBlock11Rods(currentMap: Record<string, string>): Record<string, string> {
    const entries = Object.entries(currentMap);
    if (!entries.length) return {};
    const rotated: Record<string, string> = {};
    for (const [slot, rod] of entries) {
        const idx = BLOCK11_KEYS.indexOf(slot as typeof BLOCK11_KEYS[number]);
        if (idx < 0) continue;
        const nextIdx = (idx + 1) % BLOCK11_KEYS.length;
        rotated[BLOCK11_KEYS[nextIdx]] = rod;
    }
    return rotated;
}

function computePinAwareBlock11RodPreference(
    rotatedMap: Record<string, string>,
    pinnedBlock3Tasks: Record<string, unknown>,
): Record<string, string> {
    if (!Object.keys(pinnedBlock3Tasks).length) return rotatedMap;

    const pinnedRods: Record<string, string> = {};
    for (const key of BLOCK11_KEYS) {
        const task = pinnedBlock3Tasks[key] as GeneratedVariant | undefined;
        if (task) {
            const rod = extractBlock11RodMap({ [key]: task } as unknown as GeneratedVariant)[key];
            if (rod) pinnedRods[key] = rod;
        }
    }

    if (!Object.keys(pinnedRods).length) return rotatedMap;

    const pinnedRodValues = new Set(Object.values(pinnedRods));
    const result: Record<string, string> = { ...pinnedRods };

    for (const [key, rod] of Object.entries(rotatedMap)) {
        if (result[key]) continue;
        if (pinnedRodValues.has(rod)) continue;
        result[key] = rod;
    }

    return result;
}

function restorePinnedTasksFrom(
    pins: Record<string, string>,
    prevVariant: GeneratedVariant,
    newVariant: GeneratedVariant,
): GeneratedVariant {
    if (!Object.keys(pins).length) return newVariant;
    const result: GeneratedVariant = { ...newVariant };
    for (const [taskKey, pinnedId] of Object.entries(pins)) {
        const prevTask = (prevVariant as unknown as Record<string, unknown>)[taskKey];
        if (
            prevTask
            && typeof prevTask === 'object'
            && prevTask !== null
            && 'id' in prevTask
            && String((prevTask as { id?: unknown }).id) === String(pinnedId)
        ) {
            (result as unknown as Record<string, unknown>)[taskKey] = prevTask;
        }
    }
    return result;
}

export function useNewTestPageV2() {
    const { user, isAuthenticated, isAdmin } = useAuth();
    const isPro = user?.isPro === true || String(user?.role) === 'admin';
    const freeTier = useFreeTierStore();
    const { taskRefreshes, incrementTaskRefresh } = freeTier;

    const [showPaywall, setShowPaywall] = useState(false);
    const [paywallMessage, setPaywallMessage] = useState('');

    const openPaywall = (message: string) => {
        setPaywallMessage(message);
        setShowPaywall(true);
    };

    const [works, setWorks] = useState<Work[]>([]);
    const [poets, setPoets] = useState<Poet[]>([]);
    const [block3, setBlock3] = useState<Block3Data | null>(null);
    const [knowledgeBaseSettings, setKnowledgeBaseSettings] = useState<KnowledgeBaseSettings>(DEFAULT_KNOWLEDGE_BASE_SETTINGS);
    const [isKnowledgeBaseLoading, setIsKnowledgeBaseLoading] = useState(true);
    const [knowledgeBaseError, setKnowledgeBaseError] = useState('');

    const [selectedWorkId, setSelectedWorkId] = useState('');
    const [selectedExcerptId, setSelectedExcerptId] = useState('');
    const [selectedPoetId, setSelectedPoetId] = useState('');
    const [selectedPoemId, setSelectedPoemId] = useState('');
    const [selectedThemeId, setSelectedThemeId] = useState('');
    const selectedBlock3AuthorId = '';

    const [task1Filters, setTask1Filters] = useState<Task1Filters>(DEFAULT_TASK1_FILTERS);

    const [variant, setVariant] = useState<GeneratedVariant | null>(null);
    const [animationKey, setAnimationKey] = useState(0);

    const [taskHistory, setTaskHistory] = useState<TaskVariantHistory>(createEmptyTaskHistory);
    const [cycleHistory, setCycleHistory] = useState<CycleHistory>(createEmptyCycleHistory);
    const [pendingVariant, setPendingVariant] = useState<GeneratedVariant | null>(null);
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [ageConfirmed, setAgeConfirmed] = useState(false);
    const [checkedAnswers, setCheckedAnswers] = useState<Set<string>>(new Set());
    const [statusMessage, setStatusMessage] = useState('');
    const [exportQuota, setExportQuota] = useState<VariantExportQuota | null>(null);
    const [limitModalMessage, setLimitModalMessage] = useState('');
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [isMobileDockOpen, setIsMobileDockOpen] = useState(false);
    const [isInitialVariantLoading, setIsInitialVariantLoading] = useState(true);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [dockLiftOffset, setDockLiftOffset] = useState(0);
    const [variantGenerationMode, setVariantGenerationMode] = useState<'new' | 'selected' | null>(null);
    const [refreshLoadingByBlock, setRefreshLoadingByBlock] = useState<BlockBooleanFlags>(() => createBlockBooleanFlags(false));
    const [refreshLoadingByTask, setRefreshLoadingByTask] = useState<TaskBooleanFlags>(() => createTaskBooleanFlags(false));
    const [refreshDisabledByTask, setRefreshDisabledByTask] = useState<TaskBooleanFlags>(() => createTaskBooleanFlags(false));
    const [isSavingVariant, setIsSavingVariant] = useState(false);
    const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());
    const [selectedChapter, setSelectedChapter] = useState('');
    const [isSettingWeeklyVariant, setIsSettingWeeklyVariant] = useState(false);
    const [weeklyPins, setWeeklyPins] = useState<Record<string, string>>({});
    const weeklyPinsRef = useRef<Record<string, string>>({});
    const variantRef = useRef<GeneratedVariant | null>(null);
    const block11RodMapRef = useRef<Record<string, string>>({});

    useEffect(() => { weeklyPinsRef.current = weeklyPins; }, [weeklyPins]);
    useEffect(() => { variantRef.current = variant; }, [variant]);

    const [selectModal, setSelectModal] = useState<{
        taskKey: string;
        inputValue: string;
        inputValue2: string;
        error: string;
    } | null>(null);

    const toggleTaskCollapse = (taskKey: string) => {
        setCollapsedTasks((prev: Set<string>) => {
            const next = new Set(prev);
            if (next.has(taskKey)) {
                next.delete(taskKey);
            } else {
                next.add(taskKey);
            }
            return next;
        });
    };

    useEffect(() => {
        let isCancelled = false;

        const loadKnowledgeBase = async () => {
            setKnowledgeBaseError('');
            setIsKnowledgeBaseLoading(true);

            try {
                const data = await fetchKnowledgeBase();
                if (isCancelled) return;

                setWorks(data.works);
                setPoets(data.poets);
                setBlock3(data.block3);
                setKnowledgeBaseSettings(data.settings);
                setWeeklyPins(data.settings.weeklyPins && typeof data.settings.weeklyPins === 'object' ? data.settings.weeklyPins : {});
                setVariant(null);
                setTaskHistory(createEmptyTaskHistory());
                setCycleHistory(createEmptyCycleHistory());
                setPendingVariant(null);
                setVariantGenerationMode(null);
                setRefreshLoadingByBlock(createBlockBooleanFlags(false));
                setIsInitialVariantLoading(data.works.length > 0 && data.poets.length > 0);
            } catch (error) {
                if (isCancelled) return;
                setKnowledgeBaseError(error instanceof Error ? error.message : 'Не удалось загрузить базу знаний из БД');
                setIsInitialVariantLoading(false);
            } finally {
                if (!isCancelled) {
                    setIsKnowledgeBaseLoading(false);
                }
            }
        };

        void loadKnowledgeBase();

        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!works.length) {
            setSelectedWorkId('');
            return;
        }

        setSelectedWorkId((prev) => (works.some((work) => work.id === prev) ? prev : works[0].id));
    }, [works]);

    useEffect(() => {
        if (!poets.length) {
            setSelectedPoetId('');
            return;
        }

        setSelectedPoetId((prev) => (poets.some((poet) => poet.id === prev) ? prev : poets[0].id));
    }, [poets]);

    const applyVariant = (nextVariant: GeneratedVariant) => {
        setVariant(nextVariant);
        setAnimationKey((prev) => prev + 1);
        setSelectedWorkId(nextVariant.work.id);
        setSelectedExcerptId(nextVariant.excerpt.id);
        setSelectedPoetId(nextVariant.poet.id);
        setSelectedPoemId(nextVariant.poem.id);
        setTaskHistory(createEmptyTaskHistory());
        setCycleHistory(createEmptyCycleHistory());
        setRefreshLoadingByTask(createTaskBooleanFlags(false));
        setRefreshDisabledByTask(createTaskBooleanFlags(false));
        setStatusMessage('');
        setIsInitialVariantLoading(false);
        setVariantGenerationMode(null);
        setRefreshLoadingByBlock(createBlockBooleanFlags(false));
        setCheckedAnswers(new Set());
        block11RodMapRef.current = extractBlock11RodMap(nextVariant);
    };

    const applyVariantWithAgeCheck = (nextVariant: GeneratedVariant) => {
        const needsAgeConfirm = nextVariant.work.age18 || nextVariant.poem.age18;
        if (needsAgeConfirm && !ageConfirmed) {
            setPendingVariant(nextVariant);
            setShowAgeModal(true);
            return;
        }

        applyVariant(nextVariant);
    };

    useEffect(() => {
        if (variant || isKnowledgeBaseLoading || knowledgeBaseError) return;

        let cancelled = false;

        const loadInitialVariant = async () => {
            setIsInitialVariantLoading(true);
            try {
                const response = await getPregeneratedVariantV2();
                if (!cancelled) {
                    applyVariant(response.variant);
                }
            } catch (error) {
                if (!cancelled) {
                    setStatusMessage(error instanceof Error ? error.message : 'Не удалось загрузить готовый вариант.');
                    setIsInitialVariantLoading(false);
                }
            }
        };

        void loadInitialVariant();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isKnowledgeBaseLoading,
        knowledgeBaseError,
        variant,
    ]);

    useEffect(() => {
        if (!user || user.role === 'admin') {
            setExportQuota(null);
            return;
        }

        let cancelled = false;

        const loadQuota = async () => {
            try {
                const quota = await getVariantExportQuota();
                if (!cancelled) {
                    setExportQuota(quota);
                }
            } catch {
                if (!cancelled) {
                    setExportQuota(null);
                }
            }
        };

        void loadQuota();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const selectedWork = useMemo<Work | null>(
        () => works.find((work) => work.id === selectedWorkId) || works[0] || null,
        [selectedWorkId, works],
    );

    const selectedWorkExcerpts = useMemo<Excerpt[]>(
        () => sortExcerptsByOrder(filterActiveItems(selectedWork?.excerpts || [])),
        [selectedWork],
    );

    const excerptDropdownOptions = useMemo(() => {
        const options: { value: string; label: string; disabled?: boolean }[] = [];
        const filtered = selectedChapter
            ? selectedWorkExcerpts.filter((ex) => ex.chapter?.trim() === selectedChapter)
            : selectedWorkExcerpts;

        if (selectedChapter) {
            filtered.forEach((ex) => options.push({ value: ex.id, label: ex.title }));
            return options;
        }

        let currentChapter: string | null = null;
        filtered.forEach((ex) => {
            const chapter = ex.chapter?.trim() || '';
            if (chapter !== currentChapter) {
                if (currentChapter !== null) {
                    options.push({ value: `__sep_${options.length}`, label: '──────────', disabled: true });
                }
                currentChapter = chapter;
            }
            options.push({ value: ex.id, label: ex.title });
        });
        return options;
    }, [selectedWorkExcerpts, selectedChapter]);

    const selectedExcerpt = useMemo<Excerpt | null>(
        () => selectedWorkExcerpts.find((excerpt) => excerpt.id === selectedExcerptId) || selectedWorkExcerpts[0] || null,
        [selectedExcerptId, selectedWorkExcerpts],
    );

    const selectedPoet = useMemo<Poet | null>(
        () => poets.find((poet) => poet.id === selectedPoetId) || poets[0] || null,
        [poets, selectedPoetId],
    );

    const selectedPoem = useMemo<Poem | null>(
        () => {
            const activePoems = filterActiveItems(selectedPoet?.poems || []);
            return activePoems.find((poem) => poem.id === selectedPoemId) || activePoems[0] || null;
        },
        [selectedPoemId, selectedPoet],
    );

    const availablePoets = useMemo(() => {
        const workAuthorTokens = new Set([
            ...parseIdentifierTokens(selectedWork?.authorId),
            ...extractAuthorTokens(selectedExcerpt),
        ]);
        if (!workAuthorTokens.size) return poets;
        const filtered = poets.filter((poet) => {
            const poetTokens = parseIdentifierTokens(poet.authorId);
            return !poetTokens.some((t) => workAuthorTokens.has(t));
        });
        return filtered.length > 0 ? filtered : poets;
    }, [poets, selectedWork, selectedExcerpt]);

    const availablePoems = useMemo(() => {
        const allPoems = filterActiveItems(selectedPoet?.poems || []);
        const excerptThemeTokens = new Set(getEntityThemeTokens(selectedExcerpt));
        const excerptAuthorTokens = new Set([
            ...parseIdentifierTokens(selectedWork?.authorId),
            ...extractAuthorTokens(selectedExcerpt),
        ]);
        if (!excerptThemeTokens.size && !excerptAuthorTokens.size) return allPoems;
        return allPoems.filter((poem) => {
            if (excerptThemeTokens.size) {
                const poemThemeTokens = getEntityThemeTokens(poem);
                if (poemThemeTokens.some((t) => excerptThemeTokens.has(t))) return false;
            }
            if (excerptAuthorTokens.size) {
                const poetAuthorTokens = parseIdentifierTokens(selectedPoet?.authorId);
                if (poetAuthorTokens.some((t) => excerptAuthorTokens.has(t))) return false;
            }
            return true;
        });
    }, [selectedPoet, selectedExcerpt, selectedWork]);

    useEffect(() => {
        if (!selectedWorkExcerpts.length) {
            setSelectedExcerptId('');
            return;
        }

        setSelectedExcerptId((prev) => (
            selectedWorkExcerpts.some((excerpt) => excerpt.id === prev)
                ? prev
                : selectedWorkExcerpts[0].id
        ));
    }, [selectedWorkExcerpts]);

    useEffect(() => {
        if (!availablePoems.length) {
            setSelectedPoemId('');
            return;
        }

        setSelectedPoemId((prev) => (
            availablePoems.some((poem) => poem.id === prev)
                ? prev
                : availablePoems[0].id
        ));
    }, [availablePoems]);

    const allThemes = useMemo(() => {
        const theme1Set = new Set<string>();
        const theme2Set = new Set<string>();

        poets.forEach((poet) => {
            poet.poems.forEach((poem) => {
                filterActiveItems(poem.tasks.task10).forEach((task) => {
                    if (task.theme1Id) theme1Set.add(task.theme1Id);
                    if (task.theme2Id) theme2Set.add(task.theme2Id);
                });
            });
        });

        const sortedTheme1 = Array.from(theme1Set).sort();
        const sortedTheme2 = Array.from(theme2Set).sort();

        const onlyTheme1 = sortedTheme1.filter(t => !theme2Set.has(t));

        const options: { value: string; label: string; disabled?: boolean }[] = [];
        sortedTheme2.forEach(t => options.push({ value: t, label: t }));

        if (sortedTheme2.length > 0 && onlyTheme1.length > 0) {
            options.push({ value: '---', label: '──────────', disabled: true });
        }

        onlyTheme1.forEach(t => options.push({ value: t, label: t }));

        return options;
    }, [poets]);

    const buildRuntimeRequestPayload = () => ({
        selectedWorkId,
        selectedExcerptId,
        selectedPoetId,
        selectedPoemId,
        selectedThemeId,
        selectedBlock3AuthorId,
        task1Filters,
    });

    const canGoBackTask = (key: VariantTaskKey) => taskHistory[key].length > 0;

    const handleGoBackTask = (key: VariantTaskKey) => {
        const history = taskHistory[key];
        if (!history.length) return;

        setVariant((current) => {
            if (!current) return current;

            const currentEvaluation = evaluateVariantRules(current);

            let matchedIndex = -1;
            let matchedVariant = current;

            for (let index = history.length - 1; index >= 0; index -= 1) {
                const previousVariant = history[index];
                const candidate = key === 'task8'
                    ? {
                        ...current,
                        task8: previousVariant.task8,
                        task8Options: previousVariant.task8Options,
                    }
                    : {
                        ...current,
                        [key]: previousVariant[key],
                    } as GeneratedVariant;
                const candidateEvaluation = evaluateVariantRules(candidate);

                const introducesCriticalConflict =
                    candidateEvaluation.criticalDuplicateTokensCount
                    > currentEvaluation.criticalDuplicateTokensCount;
                const breaksPreviouslyOkRules =
                    currentEvaluation.ok && !candidateEvaluation.ok;

                if (!introducesCriticalConflict && !breaksPreviouslyOkRules) {
                    matchedIndex = index;
                    matchedVariant = candidate;
                    break;
                }
            }

            if (matchedIndex < 0) {
                setTaskHistory((prev) => ({ ...prev, [key]: [] }));
                setStatusMessage('Предыдущие варианты конфликтуют с текущими ограничениями.');
                return current;
            }

            setTaskHistory((prev) => ({
                ...prev,
                [key]: prev[key].slice(0, matchedIndex),
            }));
            setRefreshDisabledByTask((prev) => ({ ...prev, [key]: false }));
            setRefreshLoadingByTask((prev) => ({ ...prev, [key]: false }));
            setStatusMessage('');
            setCheckedAnswers((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
            return matchedVariant;
        });
    };

    const sceneNavigation = useMemo(() => {
        if (!variant) {
            return { hasPrevious: false, hasNext: false };
        }

        const currentWork = works.find((work) => work.id === variant.work.id) || variant.work;
        const orderedExcerpts = sortExcerptsByOrder(currentWork.excerpts || []);
        const currentIndex = orderedExcerpts.findIndex((excerpt) => excerpt.id === variant.excerpt.id);

        return {
            hasPrevious: currentIndex > 0,
            hasNext: currentIndex >= 0 && currentIndex < orderedExcerpts.length - 1,
        };
    }, [variant, works]);

    const navigateScene = (direction: 'previous' | 'next') => {
        if (!variant) return;

        const currentWork = works.find((work) => work.id === variant.work.id) || variant.work;
        const orderedExcerpts = sortExcerptsByOrder(currentWork.excerpts || []);
        const currentIndex = orderedExcerpts.findIndex((excerpt) => excerpt.id === variant.excerpt.id);

        if (currentIndex < 0) return;

        const targetIndex = direction === 'previous' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= orderedExcerpts.length) return;

        const targetExcerpt = orderedExcerpts[targetIndex];
        setRefreshLoadingByBlock((prev) => ({ ...prev, block1: true }));
        void (async () => {
            try {
                const response = await refreshRuntimeVariantBlockV2({
                    ...buildRuntimeRequestPayload(),
                    selectedWorkId: currentWork.id,
                    selectedExcerptId: targetExcerpt.id,
                    block: 'block1',
                    variant,
                });
                const withPins = variantRef.current
                    ? restorePinnedTasksFrom(weeklyPinsRef.current, variantRef.current, response.variant)
                    : response.variant;
                applyVariantWithAgeCheck(withPins);
                setStatusMessage('');
                setCheckedAnswers(new Set());
            } catch (error) {
                setStatusMessage(error instanceof Error ? error.message : 'Не удалось переключить сцену.');
            } finally {
                setRefreshLoadingByBlock((prev) => ({ ...prev, block1: false }));
            }
        })();
    };

    const poemNavigation = useMemo(() => {
        if (!variant) return { hasPrevious: false, hasNext: false, pool: [], currentIndex: -1 };

        let pool: { poetId: string; poemId: string }[] = [];

        if (selectedThemeId) {
            poets.forEach((poet) => {
                poet.poems.forEach((poem) => {
                    const hasTheme = filterActiveItems(poem.tasks.task10).some(
                        (task) => task.theme1Id === selectedThemeId || task.theme2Id === selectedThemeId
                    );
                    if (hasTheme) {
                        pool.push({ poetId: poet.id, poemId: poem.id });
                    }
                });
            });

            pool.sort((a, b) => {
                const poetA = poets.find(p => p.id === a.poetId)?.name || '';
                const poetB = poets.find(p => p.id === b.poetId)?.name || '';
                if (poetA !== poetB) return poetA.localeCompare(poetB);
                const poemA = poets.find(p => p.id === a.poetId)?.poems.find(p => p.id === a.poemId)?.title || '';
                const poemB = poets.find(p => p.id === b.poetId)?.poems.find(p => p.id === b.poemId)?.title || '';
                return poemA.localeCompare(poemB);
            });
        } else {
            const currentPoet = poets.find((p) => p.id === variant.poet.id) || variant.poet;
            currentPoet.poems.forEach((poem) => {
                pool.push({ poetId: currentPoet.id, poemId: poem.id });
            });
        }

        const currentIndex = pool.findIndex(
            (item) => item.poetId === variant.poet.id && item.poemId === variant.poem.id
        );

        return {
            hasPrevious: currentIndex > 0,
            hasNext: currentIndex >= 0 && currentIndex < pool.length - 1,
            pool,
            currentIndex,
        };
    }, [variant, poets, selectedThemeId]);

    const navigatePoem = (direction: 'previous' | 'next') => {
        if (!variant || !poemNavigation.pool.length) return;

        const { pool, currentIndex } = poemNavigation;
        if (currentIndex < 0) return;

        const targetIndex = direction === 'previous' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= pool.length) return;

        const target = pool[targetIndex];
        setRefreshLoadingByBlock((prev) => ({ ...prev, block2: true }));
        void (async () => {
            try {
                setSelectedPoetId(target.poetId);
                setSelectedPoemId(target.poemId);

                const response = await refreshRuntimeVariantBlockV2({
                    ...buildRuntimeRequestPayload(),
                    selectedPoetId: target.poetId,
                    selectedPoemId: target.poemId,
                    block: 'block2',
                    variant,
                });
                const withPins = variantRef.current
                    ? restorePinnedTasksFrom(weeklyPinsRef.current, variantRef.current, response.variant)
                    : response.variant;
                applyVariantWithAgeCheck(withPins);
                setStatusMessage('');
                setCheckedAnswers(new Set());
            } catch (error) {
                setStatusMessage(error instanceof Error ? error.message : 'Не удалось переключить стихотворение.');
            } finally {
                setRefreshLoadingByBlock((prev) => ({ ...prev, block2: false }));
            }
        })();
    };

    const generateVariant = (useSelected: boolean) => {
        if (variantGenerationMode || Object.values(refreshLoadingByBlock).some(Boolean)) return;

        if (!isPro) {
            if (freeTier.generations >= FREE_TIER_LIMITS.GENERATIONS) {
                openPaywall('Лимит бесплатных генераций исчерпан.');
                return;
            }
            freeTier.incrementGenerations();
        }

        setVariantGenerationMode(useSelected ? 'selected' : 'new');
        setStatusMessage(useSelected ? 'Обновляю все задания…' : 'Генерирую новый вариант…');
        void (async () => {
            try {
                const response = await generateRuntimeVariantV2({
                    ...buildRuntimeRequestPayload(),
                    useSelected,
                });
                const withPins = variantRef.current
                    ? restorePinnedTasksFrom(weeklyPinsRef.current, variantRef.current, response.variant)
                    : response.variant;
                applyVariantWithAgeCheck(withPins);
                setStatusMessage('');
                setCheckedAnswers(new Set());
            } catch (error) {
                setStatusMessage(error instanceof Error ? error.message : 'Не удалось создать вариант.');
            } finally {
                setVariantGenerationMode(null);
            }
        })();
    };

    useEffect(() => {
        if (!variant) {
            setDockLiftOffset(0);
            return;
        }

        const updateDockOffset = () => {
            const footer = document.querySelector('footer');
            if (!footer) {
                setDockLiftOffset(0);
                return;
            }

            const rect = footer.getBoundingClientRect();
            const safeGap = 16;
            const overlap = Math.max(0, window.innerHeight - rect.top + safeGap);
            setDockLiftOffset(overlap);
        };

        updateDockOffset();
        window.addEventListener('scroll', updateDockOffset, { passive: true });
        window.addEventListener('resize', updateDockOffset);

        return () => {
            window.removeEventListener('scroll', updateDockOffset);
            window.removeEventListener('resize', updateDockOffset);
        };
    }, [variant]);

    const handleConfirmAge = () => {
        setAgeConfirmed(true);
        setShowAgeModal(false);

        if (pendingVariant) {
            applyVariant(pendingVariant);
            setPendingVariant(null);
        }
    };

    const toggleTaskAnswer = (taskKey: string) => {
        setCheckedAnswers((prev) => {
            const next = new Set(prev);
            if (next.has(taskKey)) {
                next.delete(taskKey);
            } else {
                next.add(taskKey);
            }
            return next;
        });
    };

    const toggleAllAnswers = () => {
        setCheckedAnswers((prev) => {
            if (prev.size > 0) return new Set();
            return new Set([
                'task1', 'task2', 'task3', 'task4_1', 'task4_2', 'task5',
                'task6', 'task7', 'task8', 'task9_1', 'task9_2', 'task10',
                'task11_1', 'task11_2', 'task11_3', 'task11_4', 'task11_5'
            ]);
        });
    };

    const handleCheckYourself = () => {
        toggleAllAnswers();
    };

    const refreshTask = (taskKey: RuntimeVariantTaskKey, task2Action?: 'full' | 'reroll' | 'properties' | 'character' | 'property', task2PairIndex?: number) => {
        if (isBusyWithFullOperations || refreshLoadingByTask[taskKey]) return;

        if (!isPro) {
            const currentRefreshes = taskRefreshes[taskKey] || 0;
            if (currentRefreshes >= FREE_TIER_LIMITS.TASK_REFRESHES) {
                openPaywall('Лимит бесплатных обновлений заданий исчерпан.');
                return;
            }
            incrementTaskRefresh(taskKey);
        }

        setRefreshLoadingByTask((prev) => ({ ...prev, [taskKey]: true }));
        void (async () => {
            try {
                const response = await refreshRuntimeVariantTaskV2({
                    ...buildRuntimeRequestPayload(),
                    taskKey,
                    variant: variantRef.current!,
                    task2Action,
                    task2PairIndex,
                });
                
                setVariant(response.variant);
                setStatusMessage('');
                setRefreshDisabledByTask((prev) => ({ ...prev, [taskKey]: false }));

                setCheckedAnswers((prev) => {
                    const next = new Set(prev);
                    next.delete(taskKey);
                    return next;
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Не удалось обновить задание.';
                setStatusMessage(message);
            } finally {
                setRefreshLoadingByTask((prev) => ({ ...prev, [taskKey]: false }));
            }
        })();
    };



    const refreshVariantBlock = async (block: RuntimeVariantBlockKey, extraPayload?: Record<string, unknown>) => {
        if (!user) {
            openPaywall('Для обновления целого блока заданий необходимо войти в аккаунт.');
            return;
        }

        if (
            !variant
            || variantGenerationMode
            || refreshLoadingByBlock[block]
            || Object.values(refreshLoadingByTask).some(Boolean)
        ) return;

        if (!isPro) {
            if (block === 'block3') {
                openPaywall('Полное обновление 11-х заданий доступно только по подписке.');
                return;
            }
            if (freeTier.generations >= FREE_TIER_LIMITS.GENERATIONS) {
                openPaywall('Лимит бесплатных наборов заданий исчерпан.');
                return;
            }
            freeTier.incrementGenerations();
        }

        setRefreshLoadingByBlock((prev) => ({ ...prev, [block]: true }));
        if (block === 'block1') {
            setStatusMessage('Обновляю отрывок и задания 1–5…');
        } else if (block === 'block2') {
            setStatusMessage('Обновляю стихотворение и задания 6–10…');
        } else if (block === 'block3') {
            setStatusMessage('Обновляю задания 11…');
        }

        try {
            const requestPayload: Parameters<typeof refreshRuntimeVariantBlockV2>[0] = {
                ...buildRuntimeRequestPayload(),
                block,
                variant,
                ...extraPayload,
            };

            if (block === 'block3') {
                const pinnedBlock3Tasks: Record<string, unknown> = {};
                for (const key of BLOCK11_KEYS) {
                    const pinnedId = weeklyPinsRef.current[key];
                    if (pinnedId && variantRef.current) {
                        const task = (variantRef.current as unknown as Record<string, unknown>)[key];
                        if (
                            task && typeof task === 'object' && task !== null
                            && 'id' in task
                            && String((task as { id?: unknown }).id) === pinnedId
                        ) {
                            pinnedBlock3Tasks[key] = task;
                        }
                    }
                }
                if (Object.keys(pinnedBlock3Tasks).length > 0) {
                    requestPayload.pinnedBlock3Tasks = pinnedBlock3Tasks;
                }
                if (Object.keys(block11RodMapRef.current).length) {
                    const rotated = rotateBlock11Rods(block11RodMapRef.current);
                    requestPayload.block11RodPreference = computePinAwareBlock11RodPreference(
                        rotated,
                        pinnedBlock3Tasks,
                    );
                }
            }

            const response = await refreshRuntimeVariantBlockV2(requestPayload);
            const withPins = variantRef.current
                ? restorePinnedTasksFrom(weeklyPinsRef.current, variantRef.current, response.variant)
                : response.variant;
            applyVariantWithAgeCheck(withPins);
            setStatusMessage('');
            setCheckedAnswers(new Set());
        } catch (error) {
            setStatusMessage(error instanceof Error ? error.message : 'Не удалось обновить блок заданий.');
        } finally {
            setRefreshLoadingByBlock((prev) => ({ ...prev, [block]: false }));
        }
    };

    const refreshBlock1 = async () => {
        const wasInChapterMode = !!selectedChapter && !selectedExcerptId;
        const extraPayload: Record<string, unknown> = {};
        let effectiveExcerpt: Excerpt | null = selectedExcerpt;

        if (wasInChapterMode) {
            const chapterExcerpts = selectedWorkExcerpts.filter(
                (ex) => ex.chapter?.trim() === selectedChapter,
            );
            if (chapterExcerpts.length > 0) {
                const currentId = selectedExcerpt?.id;
                const candidates = chapterExcerpts.filter((ex) => ex.id !== currentId);
                const pool = candidates.length > 0 ? candidates : chapterExcerpts;
                const picked = pool[Math.floor(Math.random() * pool.length)];
                extraPayload.selectedExcerptId = picked.id;
                effectiveExcerpt = picked;
            }
        }

        const excerptThemes = new Set([
            ...parseIdentifierTokens(effectiveExcerpt?.themeInternalId),
            ...extractThemeTokens(effectiveExcerpt, 'excerpt'),
        ]);
        const poemThemes = [
            ...parseIdentifierTokens(selectedPoem?.themeInternalId),
            ...extractThemeTokens(selectedPoem, 'poem'),
        ];
        const hasThemeConflict = excerptThemes.size > 0 && poemThemes.some((t) => excerptThemes.has(t));
        if (hasThemeConflict) {
            // eslint-disable-next-line no-alert
            const confirmed = window.confirm(
                'Тема в выбранном отрывке совпадает с темой стихотворения. Заменить стихотворение на другое?',
            );
            if (!confirmed) return;
            extraPayload.replaceConflictingPoem = true;
        }

        await refreshVariantBlock('block1', extraPayload);

        if (wasInChapterMode) {
            setSelectedExcerptId('');
        }
    };

    const refreshBlock2 = () => {
        void refreshVariantBlock('block2');
    };

    const refreshBlock3 = () => {
        void refreshVariantBlock('block3');
    };

    const getQuotaCaption = (quota: VariantExportQuota | null) => {
        if (!user) {
            return 'Для скачивания и печати войдите в аккаунт.';
        }
        if (user.role === 'admin') {
            return 'Доступ к скачиваниям и печати безлимитный (админ).';
        }
        if (!quota) {
            return 'Не удалось загрузить квоту скачиваний.';
        }

        return `Бесплатных на сегодня: ${quota.dailyFreeRemaining} из ${quota.dailyFreeLimit}. Платных в запасе: ${quota.paidDownloadsRemaining}.`;
    };

    const consumeExportQuota = async () => {
        const forceLimitPopup = new URLSearchParams(window.location.search).get('forceQuotaPopup') === '1';
        if (forceLimitPopup) {
            setLimitModalMessage('Экспорт временно недоступен.');
            setShowLimitModal(true);
            return { allowed: false };
        }

        if (!isPro) {
            if (freeTier.downloads >= FREE_TIER_LIMITS.DOWNLOADS) {
                openPaywall('Лимит бесплатных скачиваний исчерпан.');
                return { allowed: false };
            }
            freeTier.incrementDownloads();
            return { allowed: true };
        }

        if (!user) {
            setLimitModalMessage('Чтобы скачать или распечатать вариант, войдите в аккаунт.');
            setShowLimitModal(true);
            return { allowed: false };
        }

        if (user.role === 'admin') {
            return { allowed: true };
        }

        try {
            const result = await consumeVariantExportQuota();
            setExportQuota(result.quota);
            setStatusMessage(result.source === 'free'
                ? 'Использовано бесплатное скачивание по подписке.'
                : 'Использовано скачивание из купленного пакета.');
            return { allowed: true };
        } catch (errorValue) {
            setLimitModalMessage(errorValue instanceof Error ? errorValue.message : 'Скачивание недоступно.');
            setShowLimitModal(true);
            try {
                const quota = await getVariantExportQuota();
                setExportQuota(quota);
            } catch {
                setExportQuota(null);
            }
            return { allowed: false };
        }
    };

    const handlePrint = async () => {
        const quota = await consumeExportQuota();
        if (!quota.allowed) return;

        window.print();
    };

    const handleDownload = async () => {
        if (!variant || isDownloadingPdf) return;
        const quota = await consumeExportQuota();
        if (!quota.allowed) return;

        const printArea = document.querySelector<HTMLElement>('.print-area');
        if (!printArea) {
            setStatusMessage('Не найден блок варианта для скачивания PDF.');
            return;
        }

        setIsDownloadingPdf(true);
        try {
            await downloadElementAsPdf({
                element: printArea,
                fileName: `Вариант - ${variant.work.title} - ${variant.poem.title}.pdf`,
            });
            setStatusMessage('PDF успешно скачан.');
        } catch (errorValue) {
            setStatusMessage(errorValue instanceof Error ? errorValue.message : 'Не удалось скачать PDF.');
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleSetWeeklyVariant = async () => {
        if (user?.role !== 'admin' || !variant || !block3) return;
        setIsSettingWeeklyVariant(true);
        try {
            await setWeeklyVariant(variant);
            alert('Вариант успешно установлен как вариант недели!');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Не удалось установить вариант недели');
        } finally {
            setIsSettingWeeklyVariant(false);
        }
    };

    const getPinConflict = useCallback((taskKey: string, task: any): string | null => {
        if (!task || !taskKey.startsWith('task11_')) return null;
        const rodLabel = getRodLabel(task.rodId);
        if (!rodLabel || !['лирика', 'пьеса', 'поэма'].includes(rodLabel)) return null;
        for (const [otherKey, pinnedId] of Object.entries(weeklyPins)) {
            if (otherKey === taskKey) continue;
            if (!otherKey.startsWith('task11_')) continue;
            const pinnedTask = variant && (variant as unknown as Record<string, unknown>)[otherKey];
            if (
                pinnedTask
                && typeof pinnedTask === 'object'
                && pinnedTask !== null
                && 'id' in pinnedTask
                && String((pinnedTask as { id?: unknown }).id) === String(pinnedId)
            ) {
                const pinnedRod = getRodLabel((pinnedTask as any).rodId);
                if (pinnedRod === rodLabel) {
                    return `${otherKey} уже закреплено с типом «${rodLabel}»`;
                }
            }
        }
        return null;
    }, [weeklyPins, variant]);

    const handlePinTask = useCallback(async (taskKey: string, taskId: string) => {
        const prevPins = weeklyPinsRef.current;
        const newPins = { ...prevPins, [taskKey]: taskId };
        setWeeklyPins(newPins);
        try {
            await saveWeeklyPins(newPins);
        } catch {
            setWeeklyPins(prevPins);
        }
    }, []);

    const handleUnpinTask = useCallback(async (taskKey: string) => {
        const prevPins = weeklyPinsRef.current;
        const newPins = { ...prevPins };
        delete newPins[taskKey];
        setWeeklyPins(newPins);
        try {
            await saveWeeklyPins(newPins);
        } catch {
            setWeeklyPins(prevPins);
        }
    }, []);

    const handleClearAllPins = useCallback(async () => {
        const prevPins = weeklyPinsRef.current;
        setWeeklyPins({});
        try {
            await saveWeeklyPins(null);
        } catch {
            setWeeklyPins(prevPins);
        }
    }, []);

    const openSelectModal = useCallback((taskKey: string) => {
        setSelectModal({ taskKey, inputValue: '', inputValue2: '', error: '' });
    }, []);

    const closeSelectModal = useCallback(() => {
        setSelectModal(null);
    }, []);

    const handleSaveVariant = async () => {
        if (!user) {
            setLimitModalMessage('Чтобы сохранить вариант в личный кабинет, войдите в аккаунт.');
            setShowLimitModal(true);
            return;
        }

        if (!variant || isSavingVariant) return;

        setIsSavingVariant(true);
        setStatusMessage('Сохраняем...');
        try {
            await saveVariant({
                variant: variant as any,
                settings: knowledgeBaseSettings as any,
            });
            setStatusMessage('Вариант успешно сохранен в личном кабинете.');
        } catch (error) {
            setStatusMessage(error instanceof Error ? error.message : 'Не удалось сохранить вариант.');
        } finally {
            setIsSavingVariant(false);
        }
    };

    const toggleAnswer = (taskKey: string) => {
        setCheckedAnswers((prev) => {
            const next = new Set(prev);
            if (next.has(taskKey)) next.delete(taskKey);
            else next.add(taskKey);
            return next;
        });
    };

    const handleConfirmSelect = useCallback(() => {
        if (!selectModal || !variant) return;
        const { taskKey, inputValue, inputValue2 } = selectModal;
        const trimmedId = inputValue.trim();
        if (!trimmedId) {
            setSelectModal((prev) => prev ? { ...prev, error: 'Введите ID задания' } : null);
            return;
        }

        let foundTask: unknown | null;
        if (taskKey === 'task3' || taskKey === 'task6') {
            const trimmedId2 = inputValue2.trim() || null;
            foundTask = buildRuntimeTwoGapTask(taskKey, trimmedId, trimmedId2, works, poets);
            if (!foundTask) {
                const label = trimmedId2 ? `${trimmedId} или ${trimmedId2}` : trimmedId;
                setSelectModal((prev) => prev ? { ...prev, error: `Задание «${label}» не найдено в базе` } : null);
                return;
            }
        } else {
            foundTask = findTaskByIdInPools(taskKey, trimmedId, works, poets, block3);
            if (!foundTask) {
                setSelectModal((prev) => prev ? { ...prev, error: `Задание «${trimmedId}» не найдено в базе для слота ${taskKey}` } : null);
                return;
            }
        }

        const testVariant = { ...variant, [taskKey]: foundTask } as GeneratedVariant;

        const currentEval = evaluateVariantRules(variant);
        const nextEval = evaluateVariantRules(testVariant);

        if (nextEval.criticalDuplicateTokensCount > 0 && nextEval.criticalDuplicateTokensCount > currentEval.criticalDuplicateTokensCount) {
            const reasons: string[] = [];
            if (nextEval.duplicateTermTokensCount > currentEval.duplicateTermTokensCount) reasons.push('повтор термина');
            if (nextEval.duplicateThemeTokensCount > currentEval.duplicateThemeTokensCount) reasons.push('повтор темы');
            if (nextEval.duplicateAuthorTokensCount > currentEval.duplicateAuthorTokensCount) reasons.push('повтор автора');
            if (nextEval.block11RodDuplicateCount > currentEval.block11RodDuplicateCount) reasons.push('повтор рода в блоке 11');
            if (nextEval.duplicateCustomTagsCount > currentEval.duplicateCustomTagsCount) reasons.push('повтор внутреннего тега');
            setSelectModal((prev) => prev ? {
                ...prev,
                error: `Нельзя добавить: ${reasons.length ? reasons.join(', ') : 'нарушение правил варианта'}`,
            } : null);
            return;
        }

        setVariant(testVariant);
        block11RodMapRef.current = extractBlock11RodMap(testVariant);
        setSelectModal(null);
        const idLabel = (taskKey === 'task3' || taskKey === 'task6') && inputValue2.trim()
            ? `#${trimmedId}+#${inputValue2.trim()}`
            : `#${trimmedId}`;
        setStatusMessage(`Задание ${taskKey} заменено на ${idLabel}`);
    }, [selectModal, variant, works, poets, block3]);

    const openFeedbackModal = () => {
        setShowFeedbackModal(true);
    };

    const handleSendFeedback = ({ name, email, comment }: { name: string; email: string; comment: string }) => {
        const details = [
            name ? `Имя: ${name}` : '',
            email ? `Email: ${email}` : '',
            variant ? `Вариант: ${variant.work.author} — ${variant.work.title} / ${variant.poet.name} — ${variant.poem.title}` : '',
            '',
            comment.trim(),
        ].filter(Boolean).join('\n');

        const subject = variant
            ? `Вопрос по варианту: ${variant.work.title} / ${variant.poem.title}`
            : 'Вопрос по варианту';

        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(details)}`;
    };

    const shouldShowVariantSkeleton = isKnowledgeBaseLoading
        || (!knowledgeBaseError && isInitialVariantLoading && !variant);
    const isAnyTaskRefreshing = Object.values(refreshLoadingByTask).some(Boolean);
    const isAnyBlockRefreshing = Object.values(refreshLoadingByBlock).some(Boolean);
    const isGeneratingVariant = variantGenerationMode !== null;
    const isBusyWithFullOperations = isGeneratingVariant || isAnyBlockRefreshing;
    const loadingOverlayMessage = isGeneratingVariant
        ? (variantGenerationMode === 'selected' ? 'Обновляю весь вариант…' : 'Генерирую новый вариант…')
        : (refreshLoadingByBlock.block3 ? 'Обновляю задания 11…' : 'Обновляю блок заданий…');
    const showAnswers = checkedAnswers.size > 0;
    const refreshTask2Properties = () => refreshTask('task2', 'reroll');

    return {
        user,
        isAuthenticated,
        isAdmin,
        isPro,
        works,
        poets,
        block3,
        knowledgeBaseSettings,
        isKnowledgeBaseLoading,
        knowledgeBaseError,
        selectedWorkId,
        setSelectedWorkId,
        selectedExcerptId,
        setSelectedExcerptId,
        selectedPoetId,
        setSelectedPoetId,
        selectedPoemId,
        setSelectedPoemId,
        selectedThemeId,
        setSelectedThemeId,
        selectedChapter,
        setSelectedChapter,
        selectedWork,
        selectedExcerpt,
        selectedPoet,
        selectedPoem,
        selectedWorkExcerpts,
        excerptDropdownOptions,
        availablePoets,
        availablePoems,
        allThemes,
        task1Filters,
        setTask1Filters,
        variant,
        setVariant,
        animationKey,
        taskHistory,
        cycleHistory,
        pendingVariant,
        showAgeModal,
        setShowAgeModal,
        setPendingVariant,
        showLimitModal,
        setShowLimitModal,
        limitModalMessage,
        showFeedbackModal,
        setShowFeedbackModal,
        showPaywall,
        setShowPaywall,
        paywallMessage,
        selectModal,
        setSelectModal,
        checkedAnswers,
        statusMessage,
        exportQuota,
        isMobileDockOpen,
        setIsMobileDockOpen,
        isInitialVariantLoading,
        isDownloadingPdf,
        dockLiftOffset,
        variantGenerationMode,
        refreshLoadingByBlock,
        refreshLoadingByTask,
        refreshDisabledByTask,
        isSavingVariant,
        collapsedTasks,
        isSettingWeeklyVariant,
        weeklyPins,
        sceneNavigation,
        poemNavigation,
        shouldShowVariantSkeleton,
        isAnyTaskRefreshing,
        isAnyBlockRefreshing,
        isGeneratingVariant,
        isBusyWithFullOperations,
        loadingOverlayMessage,
        showAnswers,
        toggleTaskCollapse,
        applyVariant,
        applyVariantWithAgeCheck,
        handleConfirmAge,
        toggleTaskAnswer,
        toggleAllAnswers,
        handleCheckYourself,
        toggleAnswer,
        canGoBackTask,
        handleGoBackTask,
        navigateScene,
        navigatePoem,
        generateVariant,
        refreshTask,
        refreshTask2Properties: refreshTask2Properties,
        refreshBlock1,
        refreshBlock2,
        refreshBlock3,
        getQuotaCaption,
        handlePrint,
        handleDownload,
        handleSetWeeklyVariant,
        getPinConflict,
        handlePinTask,
        handleUnpinTask,
        handleClearAllPins,
        openSelectModal,
        closeSelectModal,
        handleConfirmSelect,
        handleSaveVariant,
        openFeedbackModal,
        handleSendFeedback,
        openPaywall,
        block11RodMapRef,
    };
}
