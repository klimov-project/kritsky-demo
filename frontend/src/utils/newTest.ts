import type {
    Block3Data,
    Block3Question,
    Block3QuestionMultiAuthor,
    Excerpt,
    MatchPair,
    MatchingQuestion,
    MultiSelectOption,
    MultiSelectQuestion,
    Poem,
    Poet,
    ShortQuestion,
    TwoGapQuestion,
    Work,
} from '@/mocks/materials';
import type { GeneratedVariant, Task1Filters } from '@/types/testVariant';
import type {
    ActivatableEntry,
    CycleHistory,
    Task2PropertyCategory,
    Task2RuntimeExclusions,
    TaskBooleanFlags,
    TaskVariantHistory,
    VariantTaskEntry,
    VariantTaskKey,
} from '@/types/ui/newTest';
import {
    BLOCK11_KEYS,
    CHARACTER_TAG_ALLOWED_KEYS,
    HTML_TAG_PATTERN,
    NO_AUTHOR_TAGS,
    ROD_SINGLE_USE_IN_BLOCK11,
    SERVICE_TAG_ALLOWED_KEYS,
    SERVICE_TAGS,
    TASK2_EXTRA_OPTION_FALLBACK,
    TASK2_PAIR_PICK_ATTEMPTS,
    TASK8_MAX_CORRECT_OPTIONS,
    TASK8_MAX_OPTIONS,
    TASK8_MIN_CORRECT_OPTIONS,
    THEME_GROUP_1_KEYS,
    THEME_GROUP_2_KEYS,
    THEME_GROUP_3_KEYS,
    VARIANT_BUILD_ATTEMPTS,
    VARIANT_TASK_KEYS,
} from '@/consts/newTest';

export const pickRandom = <T,>(items: T[]): T | null => {
    if (!items.length) return null;
    return items[Math.floor(Math.random() * items.length)];
};

export const shuffle = <T,>(items: T[]): T[] => {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }
    return next;
};

export const pickManyRandom = <T,>(items: T[], count: number): T[] => {
    if (count <= 0) return [];
    return shuffle(items).slice(0, count);
};

export const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};


export const sortExcerptsByOrder = (excerpts: Excerpt[]): Excerpt[] => {
    return excerpts
        .map((excerpt, index) => ({ excerpt, index }))
        .sort((a, b) => {
            const orderA = Number.isFinite(a.excerpt.order) ? a.excerpt.order : a.index + 1;
            const orderB = Number.isFinite(b.excerpt.order) ? b.excerpt.order : b.index + 1;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            return a.index - b.index;
        })
        .map((entry) => entry.excerpt);
};

export const filterActiveItems = <T extends ActivatableEntry,>(items: T[]): T[] => {
    return items.filter((item) => item.isActive !== false);
};


export const isTermQuestion = (question: ShortQuestion) => {
    if (typeof question.isTermQuestion === 'boolean') {
        return question.isTermQuestion;
    }

    const rawTags = [question.tags, (question as ShortQuestion & { tag?: unknown }).tag]
        .flatMap((value) => {
            if (typeof value === 'string') return [value];
            if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === 'string');
            return [];
        })
        .join(',');

    if (rawTags) {
        const normalizedTags = rawTags
            .split(/[,\n;]+/u)
            .map((tag) => tag.toLowerCase().replace(/^#+/u, '').trim())
            .filter(Boolean);

        return normalizedTags.some((tag) => tag === 'термин' || tag.startsWith('термин:'));
    }

    return Boolean(question.termId);
};

export const filterTask1BySettings = (questions: ShortQuestion[], filters: Task1Filters) => {
    if (filters.includeWorkQuestions && filters.includeTermQuestions) {
        return questions;
    }

    if (!filters.includeWorkQuestions && !filters.includeTermQuestions) {
        return questions;
    }

    return questions.filter((question) => {
        const termQuestion = isTermQuestion(question);
        if (filters.includeTermQuestions && termQuestion) return true;
        if (filters.includeWorkQuestions && !termQuestion) return true;
        return false;
    });
};


export const getTask2RightOptions = (question: MatchingQuestion | null): string[] => {
    if (!question) return [];
    if (question.shuffledRightOptions) return question.shuffledRightOptions;

    const options = question.pairs
        .map((pair) => pair.properties.find((property) => property.trim())?.trim() || '')
        .filter(Boolean);

    if (question.extraOption?.trim()) {
        options.push(question.extraOption.trim());
    }

    return options;
};

export const normalizeTask2Comparable = (value: string): string => value.trim().toLowerCase();

export const buildIdentifierExclusionSet = (values: string[] | undefined): Set<string> => {
    const tokens = new Set<string>();
    (values || [])
        .flatMap((value) => parseIdentifierTokens(value))
        .forEach((token) => tokens.add(token));
    return tokens;
};

export const buildTextExclusionSet = (values: string[] | undefined): Set<string> => {
    const tokens = new Set<string>();
    (values || [])
        .map((value) => normalizeTask2Comparable(value))
        .filter(Boolean)
        .forEach((token) => tokens.add(token));
    return tokens;
};

export const normalizeComparableId = (value: string): string => value.trim().toLowerCase();

export const buildIdExclusionSet = (values: string[] | undefined): Set<string> => {
    const tokens = new Set<string>();
    (values || [])
        .flatMap((value) => String(value || '').split(/[,\n;]+/u))
        .map((value) => normalizeComparableId(value))
        .filter(Boolean)
        .forEach((token) => tokens.add(token));
    return tokens;
};

export const hasExcludedId = (exclusions: Set<string>, id: string): boolean => {
    return exclusions.has(normalizeComparableId(id));
};

export const buildTask2RuntimeExclusions = (excerptTasks?: Excerpt['tasks']): Task2RuntimeExclusions => ({
    characters: buildTextExclusionSet(excerptTasks?.excludeTask2Characters),
    properties: buildTextExclusionSet(excerptTasks?.excludeTask2Properties),
});

export const normalizePropertyList = (value: string[] | undefined): string[] => {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
};

export const getPairPropertiesByCategory = (
    pair: MatchPair,
    category: Task2PropertyCategory,
): string[] => {
    const typed = category === 'phrases'
        ? normalizePropertyList(pair.phrases)
        : normalizePropertyList(pair.characteristics);

    if (typed.length) {
        return typed;
    }

    const hasTypedProperties = normalizePropertyList(pair.phrases).length > 0 || normalizePropertyList(pair.characteristics).length > 0;
    if (hasTypedProperties) {
        return [];
    }

    return normalizePropertyList(pair.properties);
};

export const resolveTask2PropertyCategory = (question: MatchingQuestion, work: Work): Task2PropertyCategory => {
    if (question.pairPropertyType === 'phrases' || question.pairPropertyType === 'characteristics') {
        return question.pairPropertyType;
    }

    if (question.characterSource === 'quotes') return 'phrases';
    if (question.characterSource === 'facts') return 'characteristics';

    const pairHasPhrases = question.pairs.some((pair) => getPairPropertiesByCategory(pair, 'phrases').length > 0);
    const pairHasCharacteristics = question.pairs.some((pair) => getPairPropertiesByCategory(pair, 'characteristics').length > 0);
    const characterHasPhrases = work.characters.some((character) => character.quotes.length > 0);
    const characterHasCharacteristics = work.characters.some((character) => character.facts.length > 0);

    const categories: Task2PropertyCategory[] = [];
    if (pairHasPhrases || characterHasPhrases) categories.push('phrases');
    if (pairHasCharacteristics || characterHasCharacteristics) categories.push('characteristics');

    return pickRandom(categories) || 'phrases';
};

export const pickCharacterProperty = (
    character: Work['characters'][number],
    category: Task2PropertyCategory,
) => {
    if (category === 'phrases') {
        return pickRandom(character.quotes) || '';
    }

    return pickRandom(character.facts) || '';
};

export const parsePositiveInteger = (value: unknown): number | null => {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(numeric) || numeric <= 0) {
        return null;
    }
    return numeric;
};

export const getTask2ConfiguredCharacterCount = (question: MatchingQuestion): number | null => {
    return parsePositiveInteger(question.characterCount);
};

export const buildTask2PairsFromCharacters = (
    work: Work,
    question: MatchingQuestion,
    category: Task2PropertyCategory,
    exclusions: Task2RuntimeExclusions,
): MatchingQuestion['pairs'] => {
    if (!work.characters.length) return [];

    const requestedCount = getTask2ConfiguredCharacterCount(question) || 3;
    const availableCharacters = work.characters.filter((character) => {
        if (exclusions.characters.has(normalizeTask2Comparable(character.name))) {
            return false;
        }

        const properties = category === 'phrases' ? character.quotes : character.facts;
        return properties.some((property) => {
            return !exclusions.properties.has(normalizeTask2Comparable(property));
        });
    });
    const count = Math.min(requestedCount, availableCharacters.length);
    if (count <= 0) return [];

    return pickManyRandom(availableCharacters, count)
        .map((character, index) => {
            const propertyPool = (category === 'phrases' ? character.quotes : character.facts)
                .map((property) => property.trim())
                .filter(Boolean)
                .filter((property) => !exclusions.properties.has(normalizeTask2Comparable(property)));
            const property = pickRandom(propertyPool) || '';
            return {
                id: `${question.id}-runtime-${character.id || index}`,
                character: character.name,
                tag: character.tag,
                properties: property ? [property] : [],
            };
        })
        .filter((pair) => Boolean(pair.character.trim()) && pair.properties.length > 0);
};

export const getPreparedTask2Pairs = (
    work: Work,
    question: MatchingQuestion,
    category: Task2PropertyCategory,
    exclusions: Task2RuntimeExclusions,
): MatchingQuestion['pairs'] => {
    const findCharacterByName = (characterName: string) => {
        const normalizedName = normalizeTask2Comparable(characterName);
        return work.characters.find((character) => normalizeTask2Comparable(character.name) === normalizedName);
    };

    return question.pairs
        .map((pair) => {
            if (exclusions.characters.has(normalizeTask2Comparable(pair.character))) {
                return null;
            }

            const pairProperties = getPairPropertiesByCategory(pair, category);
            const allowedPairProperties = pairProperties.filter((property) => {
                return !exclusions.properties.has(normalizeTask2Comparable(property));
            });
            const generatedProperty = pairProperties.length
                ? ''
                : pickCharacterProperty(
                    findCharacterByName(pair.character) || {
                        id: '',
                        name: '',
                        quotes: [],
                        facts: [],
                    },
                    category,
                );
            const normalizedProperties = (allowedPairProperties.length ? allowedPairProperties : [generatedProperty])
                .map((property) => property.trim())
                .filter(Boolean);
            const filteredProperties = normalizedProperties.filter((property) => {
                return !exclusions.properties.has(normalizeTask2Comparable(property));
            });

            return {
                ...pair,
                properties: Array.from(new Set(filteredProperties)),
            };
        })
        .filter((pair): pair is MatchingQuestion['pairs'][number] => pair !== null)
        .filter((pair) => Boolean(pair.character.trim()) && pair.properties.length > 0);
};

export const pickTask2PairsWithSingleOptions = (pairs: MatchingQuestion['pairs']): MatchingQuestion['pairs'] => {
    if (!pairs.length) return [];

    let bestAttempt: MatchingQuestion['pairs'] = [];
    let bestUniqueCount = -1;

    for (let attempt = 0; attempt < TASK2_PAIR_PICK_ATTEMPTS; attempt += 1) {
        const usedOptions = new Set<string>();

        const attemptPairs = pairs
            .map((pair) => {
                const pool = shuffleArray(pair.properties);
                const selected = pool.find((option) => !usedOptions.has(option)) || pool[0] || '';

                if (selected) {
                    usedOptions.add(selected);
                }

                return {
                    ...pair,
                    properties: selected ? [selected] : [],
                };
            })
            .filter((pair) => pair.properties.length > 0);

        const uniqueCount = new Set(attemptPairs.map((pair) => pair.properties[0])).size;

        if (uniqueCount > bestUniqueCount) {
            bestAttempt = attemptPairs;
            bestUniqueCount = uniqueCount;
        }

        if (uniqueCount === attemptPairs.length) {
            return attemptPairs;
        }
    }

    return bestAttempt;
};

export const buildRuntimeTask2 = (
    work: Work,
    question: MatchingQuestion | null,
    excerptTasks?: Excerpt['tasks'],
): MatchingQuestion | null => {
    if (!question) return null;
    const propertyCategory = resolveTask2PropertyCategory(question, work);
    const exclusions = buildTask2RuntimeExclusions(excerptTasks);
    const task2IdExclusions = buildIdExclusionSet(excerptTasks?.excludeTask2Ids);
    const task2TermExclusions = buildIdentifierExclusionSet(excerptTasks?.excludeTask2TermIds);
    const normalizedPairs = getPreparedTask2Pairs(work, question, propertyCategory, exclusions);

    const configuredPairCount = getTask2ConfiguredCharacterCount(question);
    const limitedPairs = configuredPairCount
        ? pickManyRandom(normalizedPairs, Math.min(configuredPairCount, normalizedPairs.length))
        : normalizedPairs;
    const basePairs = limitedPairs.length ? limitedPairs : buildTask2PairsFromCharacters(work, question, propertyCategory, exclusions);
    const pairs = pickTask2PairsWithSingleOptions(basePairs);
    if (!pairs.length) return null;

    const usedCharacters = new Set(pairs.map((pair) => pair.character.trim().toLowerCase()));
    const sameQuestionDistractors = normalizedPairs
        .filter((pair) => !usedCharacters.has(pair.character.trim().toLowerCase()))
        .flatMap((pair) => pair.properties)
        .map((property) => property.trim())
        .filter(Boolean);

    const allWorkPairs = filterActiveItems(work.commonTasks.task2)
        .filter((entry) => !hasExcludedId(task2IdExclusions, entry.id))
        .filter((entry) => !extractTermTokens(entry, 'task2-distractor').some((token) => task2TermExclusions.has(token)))
        .flatMap((entry) => (
            getPreparedTask2Pairs(work, entry, resolveTask2PropertyCategory(entry, work), exclusions)
        ));

    const candidatePairs = allWorkPairs.filter((pair) => {
        return (
            !usedCharacters.has(pair.character.trim().toLowerCase())
            && !exclusions.characters.has(normalizeTask2Comparable(pair.character))
        );
    });
    const distractorProperties = candidatePairs
        .flatMap((pair) => pair.properties)
        .filter((property) => !exclusions.properties.has(normalizeTask2Comparable(property)))
        .filter(Boolean);
    const characterDistractors = work.characters
        .filter((character) => !usedCharacters.has(character.name.trim().toLowerCase()))
        .filter((character) => !exclusions.characters.has(normalizeTask2Comparable(character.name)))
        .map((character) => {
            const propertyPool = (propertyCategory === 'phrases' ? character.quotes : character.facts)
                .map((property) => property.trim())
                .filter(Boolean)
                .filter((property) => !exclusions.properties.has(normalizeTask2Comparable(property)));
            return pickRandom(propertyPool) || '';
        })
        .map((property) => property.trim())
        .filter(Boolean);
    const distractorPool = Array.from(new Set([...distractorProperties, ...characterDistractors]));

    const rightOptions = pairs.map((pair) => pair.properties[0]).filter(Boolean);
    const usedRightOptions = new Set(rightOptions);

    const sameQuestionExtraOption = pickRandom(
        Array.from(new Set(sameQuestionDistractors))
            .filter((option) => !usedRightOptions.has(option)),
    ) || '';

    const explicitExtraOption = question.extraOption?.trim() || '';
    const extraOptionCandidate = sameQuestionExtraOption
        || (explicitExtraOption && !usedRightOptions.has(explicitExtraOption)
            && !exclusions.properties.has(normalizeTask2Comparable(explicitExtraOption))
            ? explicitExtraOption
            : pickRandom(distractorPool.filter((option) => !usedRightOptions.has(option))) || '');

    const fallbackExtraOption = usedRightOptions.has(TASK2_EXTRA_OPTION_FALLBACK)
        ? 'Лишний вариант'
        : TASK2_EXTRA_OPTION_FALLBACK;
    const extraOption = extraOptionCandidate && !usedRightOptions.has(extraOptionCandidate)
        ? extraOptionCandidate
        : fallbackExtraOption;

    const options = [...rightOptions, extraOption];

    return {
        ...question,
        pairPropertyType: propertyCategory,
        pairs,
        extraOption,
        shuffledRightOptions: shuffleArray(options),
    };
};

export const getTask2AnswerMap = (question: MatchingQuestion | null, russianLetters: string[]): string => {
    if (!question) return '—';

    const rightOptions = getTask2RightOptions(question);
    if (!rightOptions.length || !question.pairs.length) return '—';

    const map = question.pairs
        .map((pair, index) => {
            const option = pair.properties[0];
            const optionIndex = option ? rightOptions.findIndex((entry) => entry === option) : -1;
            const rightToken = optionIndex >= 0 ? String(optionIndex + 1) : '?';
            return `${russianLetters[index] || `${index + 1}`}-${rightToken}`;
        });

    return map.length ? map.join(', ') : '—';
};

export const getTask2RuntimeSignature = (question: MatchingQuestion | null): string => {
    if (!question) return 'task2-empty';

    const pairsSignature = question.pairs
        .map((pair) => {
            const character = pair.character.trim();
            const properties = pair.properties.map((property) => property.trim()).filter(Boolean).join('|');
            return `${character}::${properties}`;
        })
        .join('||');

    const rightOptionsSignature = getTask2RightOptions(question)
        .map((option) => option.trim())
        .filter(Boolean)
        .join('|');

    return `${question.id}::${pairsSignature}::${rightOptionsSignature}`;
};


export const getTwoGapAnswerLength = (question: Pick<TwoGapQuestion, 'answer1' | 'answer2'>): number => {
    return `${question.answer1}${question.answer2}`.replace(/\s+/g, '').length;
};

export const isTwoGapValid = (question: TwoGapQuestion) => {
    return getTwoGapAnswerLength(question) <= 17;
};

export const createRuntimeId = (base: string, suffix = 0) => `${base}-${suffix}`;

export const dedupeTwoGapEntries = (entries: TwoGapQuestion[]): TwoGapQuestion[] => {
    const seen = new Set<string>();
    return entries.filter((entry) => {
        const key = `${entry.id}::${entry.part1}::${entry.answer1}::${entry.part2 || ''}::${entry.answer2 || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export const extractTwoGapTermTokens = (entry: TwoGapQuestion): Set<string> => {
    const tokens = new Set<string>();

    [entry.termId1, entry.termId2]
        .flatMap((value) => (value || '').split(/[,\n;]+/u))
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
        .forEach((value) => tokens.add(value));

    (entry.tags || '')
        .split(/[,\n;]+/u)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
        .forEach((tag) => {
            if (!tag.startsWith('термин:')) return;
            tag
                .slice('термин:'.length)
                .split(/[,\n;]+/u)
                .map((value) => value.trim().toLowerCase())
                .filter(Boolean)
                .forEach((value) => tokens.add(value));
        });

    return tokens;
};

export const extractTwoGapTags = (entry: TwoGapQuestion): Set<string> => {
    const tags = new Set<string>();

    (entry.tags || '')
        .split(/[,\n;]+/u)
        .map((value) => value.toLowerCase().replace(/^#+/u, '').trim())
        .filter(Boolean)
        .forEach((value) => tags.add(value));

    return tags;
};

export const hasTermTokenOverlap = (left: Set<string>, right: Set<string>): boolean => {
    for (const token of left) {
        if (right.has(token)) return true;
    }
    return false;
};

export const hasOwnSecondGap = (entry: TwoGapQuestion): boolean => {
    return Boolean(entry.part2?.trim() || entry.answer2?.trim() || entry.termId2?.trim());
};

export const buildSingleRuntimeTwoGap = (entry: TwoGapQuestion, runtimeKey: string): TwoGapQuestion => {
    return {
        id: createRuntimeId(`${runtimeKey}-${entry.id}`),
        part1: entry.part1,
        part2: entry.part2?.trim() || '_____',
        answer1: entry.answer1,
        answer2: entry.answer2 || '',
        termId1: entry.termId1,
        termId2: entry.termId2 || '',
        tags: entry.tags,
        withoutAuthor: entry.withoutAuthor,
    };
};

export const buildPairedRuntimeTwoGap = (
    first: TwoGapQuestion,
    second: TwoGapQuestion,
    runtimeKey: string,
): TwoGapQuestion => {
    return {
        id: createRuntimeId(`${runtimeKey}-${first.id}-${second.id}`),
        part1: first.part1,
        part2: second.part1,
        answer1: first.answer1,
        answer2: second.answer1,
        termId1: first.termId1,
        termId2: second.termId1,
        tags: [first.tags, second.tags].filter(Boolean).join(', '),
        withoutAuthor: first.withoutAuthor || second.withoutAuthor,
    };
};

export const buildRuntimeTwoGapCandidates = (entries: TwoGapQuestion[], runtimeKey: string): TwoGapQuestion[] => {
    if (!entries.length) return [];

    const validEntries = entries.filter(isTwoGapValid);
    if (!validEntries.length) return [];

    const standaloneCandidates = validEntries
        .filter((entry) => hasOwnSecondGap(entry))
        .map((entry) => buildSingleRuntimeTwoGap(entry, runtimeKey));

    const pairableEntries = validEntries.filter((entry) => !hasOwnSecondGap(entry));
    const pairedCandidates: TwoGapQuestion[] = [];

    for (let firstIndex = 0; firstIndex < pairableEntries.length; firstIndex += 1) {
        const first = pairableEntries[firstIndex];
        const firstTermTokens = extractTwoGapTermTokens(first);
        const firstTags = extractTwoGapTags(first);

        for (let secondIndex = 0; secondIndex < pairableEntries.length; secondIndex += 1) {
            const second = pairableEntries[secondIndex];
            if (first.id === second.id) continue;

            const secondTermTokens = extractTwoGapTermTokens(second);
            const secondTags = extractTwoGapTags(second);
            const runtimeQuestion = buildPairedRuntimeTwoGap(first, second, runtimeKey);

            if (
                hasTermTokenOverlap(firstTermTokens, secondTermTokens)
                || hasTermTokenOverlap(firstTags, secondTags)
                || !isTwoGapValid(runtimeQuestion)
            ) {
                continue;
            }

            pairedCandidates.push(runtimeQuestion);
        }
    }

    if (pairedCandidates.length) {
        return dedupeTwoGapEntries([...pairedCandidates, ...standaloneCandidates]);
    }

    return dedupeTwoGapEntries(validEntries.map((entry) => buildSingleRuntimeTwoGap(entry, runtimeKey)));
};

export const buildRuntimeTwoGap = (entries: TwoGapQuestion[], runtimeKey: string): TwoGapQuestion | null => {
    return pickRandom(buildRuntimeTwoGapCandidates(entries, runtimeKey));
};


export const filterWithFallback = <T,>(items: T[], predicate: (item: T) => boolean): T[] => {
    const filtered = items.filter(predicate);
    return filtered.length ? filtered : items;
};

export const buildTaskPools = (work: Work, excerpt: Excerpt, task1Filters: Task1Filters, works: Work[]) => {
    const task1IdExclusions = buildIdExclusionSet(excerpt.tasks.excludeTask1Ids);
    const task1TermExclusions = buildIdentifierExclusionSet(excerpt.tasks.excludeTask1TermIds);
    const task2IdExclusions = buildIdExclusionSet(excerpt.tasks.excludeTask2Ids);
    const task2TermExclusions = buildIdentifierExclusionSet(excerpt.tasks.excludeTask2TermIds);
    const task3IdExclusions = buildIdExclusionSet(excerpt.tasks.excludeTask3Ids);
    const task3TermExclusions = buildIdentifierExclusionSet(excerpt.tasks.excludeTask3TermIds);
    const matchesExcludedTerm = (value: unknown, excluded: Set<string>, fallbackPrefix: string) => (
        excluded.size > 0 && extractTermTokens(value, fallbackPrefix).some((token) => excluded.has(token))
    );
    const matchesExcludedId = (id: string, excluded: Set<string>) => hasExcludedId(excluded, id);
    const task1Raw = [
        ...filterActiveItems(work.commonTasks.task1),
        ...filterActiveItems(excerpt.tasks.customTask1),
    ].filter((q) => (
        !matchesExcludedId(q.id, task1IdExclusions) && !matchesExcludedTerm(q, task1TermExclusions, 'excerpt-task1')
    ));

    const task1 = filterTask1BySettings(task1Raw, task1Filters);

    const task2 = [
        ...filterActiveItems(work.commonTasks.task2),
        ...filterActiveItems(excerpt.tasks.customTask2),
    ].filter((q) => (
        !matchesExcludedId(q.id, task2IdExclusions) && !matchesExcludedTerm(q, task2TermExclusions, 'excerpt-task2')
    ));

    const localTask3 = [
        ...filterActiveItems(work.commonTasks.task3),
        ...filterActiveItems(excerpt.tasks.customTask3),
    ].filter((q) => (
        !matchesExcludedId(q.id, task3IdExclusions) && !matchesExcludedTerm(q, task3TermExclusions, 'excerpt-task3')
    )).filter(isTwoGapValid);

    const task3 = dedupeTwoGapEntries([...localTask3]);

    return {
        task1,
        task2,
        task3,
        task4_1: filterActiveItems(excerpt.tasks.task4_1),
        task4_2: filterActiveItems(excerpt.tasks.task4_2),
        task5: filterActiveItems(excerpt.tasks.task5),
    };
};

export const buildPoemPools = (poem: Poem, poets: Poet[], selectedThemeId?: string) => {
    const activeTask10 = filterActiveItems(poem.tasks.task10);
    const filteredTask10 = selectedThemeId
        ? activeTask10.filter((task) => {
            return (
                task.theme1Id === selectedThemeId
                || task.theme2Id === selectedThemeId
            );
        })
        : activeTask10;

    const localTask6 = filterActiveItems(poem.tasks.task6).filter(isTwoGapValid);
    return {
        task6: dedupeTwoGapEntries([...localTask6]),
        task7: filterActiveItems(poem.tasks.task7),
        task8: filterActiveItems(poem.tasks.task8),
        task9_1: filterActiveItems(poem.tasks.task9_1),
        task9_2: filterActiveItems(poem.tasks.task9_2),
        task10: filteredTask10,
    };
};

export const buildBlock3Pools = (block3: Block3Data, preferredAuthorId: string, excludedAuthorIds: string[] = []) => {
    const activeTask11_1 = filterActiveItems(block3.task11_1);
    const activeTask11_2_3 = filterActiveItems(block3.task11_2_3);
    const activeTask11_4 = filterActiveItems(block3.task11_4);
    const activeTask11_5 = filterActiveItems(block3.task11_5);

    const excludedAuthorTokens = new Set(parseIdentifierTokens(excludedAuthorIds));
    const excludeAuthors = <T extends Block3Question | Block3QuestionMultiAuthor,>(items: T[]): T[] => {
        if (!excludedAuthorTokens.size) return items;
        return filterWithFallback(items, (question) => {
            const authorTokens = extractAuthorTokens(question);
            return authorTokens.every((token) => !excludedAuthorTokens.has(token));
        });
    };

    const filtered = {
        task11_1: excludeAuthors(activeTask11_1),
        task11_2_3: excludeAuthors(activeTask11_2_3),
        task11_4: excludeAuthors(activeTask11_4),
        task11_5: excludeAuthors(activeTask11_5),
    };

    if (!preferredAuthorId) {
        return filtered;
    }

    const preferredAuthorTokens = new Set(parseIdentifierTokens(preferredAuthorId));
    const matchesPreferredAuthor = (question: Block3Question | Block3QuestionMultiAuthor) => {
        return extractAuthorTokens(question).some((token) => preferredAuthorTokens.has(token));
    };

    return {
        task11_1: filterWithFallback(filtered.task11_1, matchesPreferredAuthor),
        task11_2_3: filterWithFallback(filtered.task11_2_3, matchesPreferredAuthor),
        task11_4: filterWithFallback(filtered.task11_4, matchesPreferredAuthor),
        task11_5: filterWithFallback(filtered.task11_5, matchesPreferredAuthor),
    };
};


export const optionKey = (option: MultiSelectOption) => `${option.termId || ''}::${option.term}`;

export const buildTask8Options = (
    baseQuestion: MultiSelectQuestion | null
): MultiSelectOption[] => {
    if (!baseQuestion || !baseQuestion.options) return [];

    const deduped = baseQuestion.options
        .map((option, index) => {
            const term = option.term.trim();
            if (!term) return null;
            return {
                ...option,
                id: option.id || `task8-opt-${index + 1}`,
                term,
            };
        })
        .filter((option): option is MultiSelectOption => option !== null)
        .filter((option, index, array) => {
            const key = optionKey(option);
            return array.findIndex((entry) => optionKey(entry) === key) === index;
        });

    const correct = shuffle(deduped.filter((option) => Boolean(option.isCorrect)));
    const incorrect = shuffle(deduped.filter((option) => !option.isCorrect));

    const targetTotal = Math.min(TASK8_MAX_OPTIONS, deduped.length);
    if (targetTotal <= 1 || !correct.length || !incorrect.length) {
        return shuffle(deduped).slice(0, targetTotal);
    }

    const minCorrectByPool = Math.max(1, targetTotal - incorrect.length);
    const maxCorrectByPool = Math.min(correct.length, targetTotal - 1);
    const preferredMinCorrect = Math.min(TASK8_MIN_CORRECT_OPTIONS, targetTotal - 1);
    const preferredMaxCorrect = Math.min(TASK8_MAX_CORRECT_OPTIONS, targetTotal - 1);

    let minCorrect = Math.max(minCorrectByPool, preferredMinCorrect);
    let maxCorrect = Math.min(maxCorrectByPool, preferredMaxCorrect);

    if (minCorrect > maxCorrect) {
        const fallbackCorrectCount = Math.min(
            maxCorrectByPool,
            Math.max(minCorrectByPool, preferredMinCorrect),
        );
        if (fallbackCorrectCount <= 0) {
            return shuffle(deduped).slice(0, targetTotal);
        }
        minCorrect = fallbackCorrectCount;
        maxCorrect = fallbackCorrectCount;
    }

    const correctCount = minCorrect === maxCorrect
        ? minCorrect
        : Math.floor(Math.random() * (maxCorrect - minCorrect + 1)) + minCorrect;
    const incorrectCount = targetTotal - correctCount;

    return shuffle([
        ...correct.slice(0, correctCount),
        ...incorrect.slice(0, incorrectCount),
    ]);
};

export const getTask8CorrectOptionNumbers = (options: MultiSelectOption[]): number[] => {
    return options.reduce<number[]>((result, option, index) => {
        if (option.isCorrect) {
            result.push(index + 1);
        }
        return result;
    }, []);
};

export const getTask8OptionsSignature = (options: MultiSelectOption[]): string => {
    return options
        .map((option, index) => `${index}:${option.id}:${option.termId || ''}:${option.term}:${option.isCorrect ? 1 : 0}`)
        .join('|');
};

export const createEmptyTaskHistory = (): TaskVariantHistory => {
    return VARIANT_TASK_KEYS.reduce((result, key) => {
        result[key] = [];
        return result;
    }, {} as TaskVariantHistory);
};

export const createEmptyCycleHistory = (): CycleHistory => {
    return VARIANT_TASK_KEYS.reduce((result, key) => {
        result[key] = [];
        return result;
    }, {} as CycleHistory);
};

export const createTaskBooleanFlags = (initialValue = false): TaskBooleanFlags => {
    return VARIANT_TASK_KEYS.reduce((result, key) => {
        result[key] = initialValue;
        return result;
    }, {} as TaskBooleanFlags);
};

export const createBlockBooleanFlags = (initialValue = false) => ({
    block1: initialValue,
    block2: initialValue,
    block3: initialValue,
});

export const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
    return Boolean(value) && typeof value === 'object';
};

export const getVariantTaskIdentity = (variant: GeneratedVariant, key: VariantTaskKey): string => {
    if (key === 'task8') {
        return `${variant.task8?.id || 'task8-empty'}::${getTask8OptionsSignature(variant.task8Options)}`;
    }

    const taskValue = variant[key];
    if (isObjectRecord(taskValue) && typeof taskValue.id === 'string') {
        return taskValue.id;
    }

    return `${key}-empty`;
};

export const normalizeTag = (value: string): string => {
    return value
        .toLowerCase()
        .replace(/^#+/u, '')
        .replace(/^тег\.?\s*/u, '')
        .replace(/\s+/g, ' ')
        .trim();
};

export const normalizeTagKindToken = (value: string): string => {
    return normalizeTag(value)
        .replace(/[._-]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

export const tagMatchesKind = (value: string, expectedKind: string): boolean => {
    const normalized = normalizeTag(value);
    const normalizedKind = normalizeTagKindToken(expectedKind);

    return normalizedKind.length > 0 && (
        normalized === normalizedKind
        || normalized.startsWith(`${normalizedKind}:`)
        || normalized.startsWith(`${normalizedKind}.`)
        || normalized.startsWith(`${normalizedKind} `)
    );
};

export const getStructuredTagPayload = (value: string, expectedKind: string): string => {
    const normalized = normalizeTag(value);
    const normalizedKind = normalizeTagKindToken(expectedKind);

    if (!normalizedKind.length || normalized === normalizedKind) {
        return '';
    }

    if (normalized.startsWith(`${normalizedKind}:`) || normalized.startsWith(`${normalizedKind}.`)) {
        return normalized.slice(normalizedKind.length + 1).trim();
    }

    if (normalized.startsWith(`${normalizedKind} `)) {
        return normalized.slice(normalizedKind.length + 1).trim();
    }

    return '';
};

export const parseTagValue = (value: unknown): string[] => {
    if (!value) return [];

    const chunks: string[] = [];

    if (typeof value === 'string') {
        chunks.push(value);
    } else if (Array.isArray(value)) {
        value.forEach((entry) => {
            if (typeof entry === 'string') {
                chunks.push(entry);
            }
        });
    }

    const normalized = chunks
        .flatMap((entry) => entry.split(/[,\n;]+/u))
        .map((entry) => normalizeTag(entry))
        .filter(Boolean);

    return Array.from(new Set(normalized));
};

export const getTags = (value: unknown): string[] => {
    if (!isObjectRecord(value)) return [];
    return [...parseTagValue(value.tags), ...parseTagValue(value.tag)];
};

export const readStringField = (value: unknown, field: string): string => {
    if (!isObjectRecord(value)) return '';
    const raw = value[field];
    return typeof raw === 'string' ? raw.trim() : '';
};

export const parseIdentifierTokens = (value: unknown): string[] => {
    if (!value) return [];

    const chunks: string[] = [];
    if (typeof value === 'string') {
        chunks.push(value);
    } else if (Array.isArray(value)) {
        value.forEach((entry) => {
            if (typeof entry === 'string') {
                chunks.push(entry);
            }
        });
    }

    const normalized = chunks
        .flatMap((entry) => entry.split(/[,\n;]+/u))
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);

    return Array.from(new Set(normalized));
};

export const readIdentifierField = (value: unknown, field: string): string[] => {
    if (!isObjectRecord(value)) return [];
    return parseIdentifierTokens(value[field]);
};

export const isAuthorTag = (tag: string): boolean => tagMatchesKind(tag, 'автор');

export const isTermTag = (tag: string): boolean => tagMatchesKind(tag, 'термин');

export const isThemeTag = (tag: string): boolean => tagMatchesKind(tag, 'тема');

export const isRodTag = (tag: string): boolean => tagMatchesKind(tag, 'род');

export const isCharacterTag = (tag: string): boolean => tagMatchesKind(tag, 'персонаж');

export const isExclusiveQuestionTag = (tag: string): boolean => {
    return tagMatchesKind(tag, 'искл вопрос')
        || tagMatchesKind(tag, 'исключительный вопрос')
        || tagMatchesKind(tag, 'спец вопрос');
};

export const isExclusiveQuestion = (value: unknown): boolean => {
    if (isObjectRecord(value) && value.special === true) {
        return true;
    }

    return getTags(value).some((tag) => isExclusiveQuestionTag(tag));
};

export const extractTermTokens = (value: unknown, _fallbackTokenPrefix: string): string[] => {
    const tokens = new Set<string>();
    void _fallbackTokenPrefix;

    readIdentifierField(value, 'termId').forEach((token) => tokens.add(token));
    readIdentifierField(value, 'termId1').forEach((token) => tokens.add(token));
    readIdentifierField(value, 'termId2').forEach((token) => tokens.add(token));


    if (isObjectRecord(value) && Array.isArray(value.options)) {
        value.options.forEach((option) => {
            readIdentifierField(option, 'termId').forEach((token) => tokens.add(token));
            readIdentifierField(option, 'termId1').forEach((token) => tokens.add(token));
            readIdentifierField(option, 'termId2').forEach((token) => tokens.add(token));
            getTags(option).forEach((tag) => {
                const payload = getStructuredTagPayload(tag, 'термин');
                if (payload) {
                    parseIdentifierTokens(payload).forEach((token) => tokens.add(token));
                }
            });
        });
    }

    const tags = getTags(value);
    tags.forEach((tag) => {
        const payload = getStructuredTagPayload(tag, 'термин');
        if (payload) {
            parseIdentifierTokens(payload).forEach((token) => tokens.add(token));
        }
    });

    if (!tokens.size && tags.some((tag) => isTermTag(tag))) {
        tokens.add('tag:термин');
    }

    return Array.from(tokens);
};

export const extractThemeTokens = (value: unknown, fallbackTokenPrefix: string): string[] => {
    const tokens = new Set<string>();

    readIdentifierField(value, 'theme1Id').forEach((token) => tokens.add(token));
    readIdentifierField(value, 'theme2Id').forEach((token) => tokens.add(token));

    const tags = getTags(value);
    tags.forEach((tag) => {
        const payload = getStructuredTagPayload(tag, 'тема');
        if (payload) {
            parseIdentifierTokens(payload).forEach((token) => tokens.add(token));
        }
    });

    if (!tokens.size && tags.some((tag) => isThemeTag(tag))) {
        tokens.add(`${fallbackTokenPrefix}:theme`);
    }

    return Array.from(tokens);
};


export const getEntityThemeTokens = (value: unknown): string[] => {
    if (!isObjectRecord(value)) return [];
    const tokens = new Set<string>();
    parseIdentifierTokens(value.themeInternalId).forEach((token) => tokens.add(token));
    getTags(value).forEach((tag) => {
        const payload = getStructuredTagPayload(tag, 'тема');
        if (payload) {
            parseIdentifierTokens(payload).forEach((token) => tokens.add(token));
        }
    });
    return Array.from(tokens);
};

export const normalizeRod = (value: string): string => {
    const normalized = normalizeTag(value);
    if (normalized.includes('лирик')) return 'лирика';
    if (normalized.includes('пьес')) return 'пьеса';
    if (normalized.includes('поэм')) return 'поэма';
    if (normalized.includes('проз')) return 'проза';
    return normalized;
};

export const extractRodTokens = (value: unknown): string[] => {
    const tokens = new Set<string>();

    const rodId = readStringField(value, 'rodId');
    if (rodId) {
        tokens.add(normalizeRod(rodId));
    }

    getTags(value).forEach((tag) => {
        const concrete = getStructuredTagPayload(tag, 'род');
        if (concrete) {
            if (concrete) tokens.add(normalizeRod(concrete));
            return;
        }
        if (ROD_SINGLE_USE_IN_BLOCK11.has(tag) || tag === 'проза') {
            tokens.add(normalizeRod(tag));
        }
    });

    return Array.from(tokens);
};

export const extractAuthorTokens = (value: unknown, fallbackAuthorId?: string): string[] => {
    const tokens = new Set<string>();

    readIdentifierField(value, 'authorId').forEach((token) => tokens.add(token));
    readIdentifierField(value, 'authorIds').forEach((token) => tokens.add(token));

    getTags(value).forEach((tag) => {
        const payload = getStructuredTagPayload(tag, 'автор');
        if (payload) {
            parseIdentifierTokens(payload).forEach((token) => tokens.add(token));
        }
    });

    if (fallbackAuthorId) {
        parseIdentifierTokens(fallbackAuthorId).forEach((token) => tokens.add(token));
    }

    return Array.from(tokens);
};

export const hasAuthorIdentity = (value: unknown, fallbackAuthorId?: string): boolean => {
    return extractAuthorTokens(value, fallbackAuthorId).length > 0;
};

export const extractBlock11SpecialTokens = (value: unknown): string[] => {
    const tokens = new Set<string>();

    extractRodTokens(value).forEach((token) => {
        if (ROD_SINGLE_USE_IN_BLOCK11.has(token)) {
            tokens.add(token);
        }
    });

    if (isExclusiveQuestion(value)) {
        tokens.add('искл вопрос');
    }

    return Array.from(tokens);
};

export const getBlock11SpecialSignature = (value: unknown): string => {
    return extractBlock11SpecialTokens(value).sort().join('|');
};

export const extractServiceTags = (value: unknown): string[] => {
    return getTags(value).filter((tag) => SERVICE_TAGS.has(tag));
};

export const isStructuralTag = (tag: string): boolean => {
    if (SERVICE_TAGS.has(tag)) return true;
    if (NO_AUTHOR_TAGS.has(tag)) return true;
    if (isAuthorTag(tag)) return true;
    if (isTermTag(tag)) return true;
    if (isThemeTag(tag)) return true;
    if (isRodTag(tag)) return true;
    if (isCharacterTag(tag)) return true;
    return false;
};

export const extractCustomInternalTags = (value: unknown): string[] => {
    return getTags(value)
        .filter((tag) => !isStructuralTag(tag))
        .map((tag) => (isExclusiveQuestionTag(tag) ? 'искл вопрос' : tag));
};

export const hasCharacterTag = (value: unknown): boolean => {
    return getTags(value).some((tag) => isCharacterTag(tag));
};

export const hasHtmlMarkup = (value: string): boolean => HTML_TAG_PATTERN.test(value);

export const normalizeNbspText = (value?: string): string => (value || '')
    .replace(/&nbsp;?/giu, ' ')
    .replace(/\u00A0/gu, ' ');



export const getVariantTaskEntries = (variant: GeneratedVariant): VariantTaskEntry[] => {
    const workAuthorId = variant.work.authorId;
    const poemAuthorId = variant.poet.authorId;
    const runtimeTask8 = variant.task8
        ? { ...variant.task8, options: variant.task8Options }
        : null;

    return [
        { key: 'task1', value: variant.task1, fallbackAuthorId: workAuthorId },
        { key: 'task2', value: variant.task2, fallbackAuthorId: workAuthorId },
        { key: 'task3', value: variant.task3, fallbackAuthorId: workAuthorId },
        { key: 'task4_1', value: variant.task4_1, fallbackAuthorId: workAuthorId },
        { key: 'task4_2', value: variant.task4_2, fallbackAuthorId: workAuthorId },
        { key: 'task5', value: variant.task5, fallbackAuthorId: workAuthorId },
        { key: 'task6', value: variant.task6, fallbackAuthorId: poemAuthorId },
        { key: 'task7', value: variant.task7, fallbackAuthorId: poemAuthorId },
        { key: 'task8', value: runtimeTask8, fallbackAuthorId: poemAuthorId },
        { key: 'task9_1', value: variant.task9_1, fallbackAuthorId: poemAuthorId },
        { key: 'task9_2', value: variant.task9_2, fallbackAuthorId: poemAuthorId },
        { key: 'task10', value: variant.task10, fallbackAuthorId: poemAuthorId },
        { key: 'task11_1', value: variant.task11_1 },
        { key: 'task11_2', value: variant.task11_2 },
        { key: 'task11_3', value: variant.task11_3 },
        { key: 'task11_4', value: variant.task11_4 },
        { key: 'task11_5', value: variant.task11_5 },
    ];
};

export const collectByKeys = (
    entriesMap: Map<VariantTaskKey, VariantTaskEntry>,
    keys: readonly VariantTaskKey[],
    extractor: (entry: VariantTaskEntry, fallbackTokenPrefix: string) => string[],
): Set<string> => {
    const values = new Set<string>();

    keys.forEach((key) => {
        const entry = entriesMap.get(key);
        if (!entry || !entry.value) return;
        extractor(entry, key).forEach((token) => values.add(token));
    });

    return values;
};

export const countDuplicateTokens = (counts: Map<string, number>): number => {
    return Array.from(counts.values())
        .reduce((accumulator, count) => accumulator + Math.max(0, count - 1), 0);
};

export const evaluateVariantRules = (
    variant: GeneratedVariant
): {
    ok: boolean;
    score: number;
    duplicateCustomTagsCount: number;
    duplicateTermTokensCount: number;
    duplicateThemeTokensCount: number;
    duplicateAuthorTokensCount: number;
    block11RodDuplicateCount: number;
    block11SpecialCoverageCount: number;
    criticalDuplicateTokensCount: number;
} => {
    const entries = getVariantTaskEntries(variant);
    const entriesMap = new Map<VariantTaskKey, VariantTaskEntry>(
        entries.map((entry) => [entry.key, entry])
    );

    const conditions: boolean[] = [];

    const block1AuthorPresent = Boolean(variant.work.authorId);
    const task5SecondAuthorPresent = Boolean(variant.task5?.authorId);
    const block2AuthorPresent = Boolean(variant.poet.authorId);
    const block11PrimaryAuthorsPresent = [variant.task11_1, variant.task11_5]
        .every((question) => question && hasAuthorIdentity(question));
    const block11OptionalAuthorsValid = [variant.task11_2, variant.task11_3]
        .every((question) => !question || hasAuthorIdentity(question));
    const task11_4AuthorsDistinct = new Set(extractAuthorTokens(variant.task11_4)).size >= 3;

    conditions.push(
        block1AuthorPresent
        && task5SecondAuthorPresent
        && block2AuthorPresent
        && block11PrimaryAuthorsPresent
        && block11OptionalAuthorsValid
        && task11_4AuthorsDistinct
    );

    const noAuthorTagInAuthorPair = entries.every((entry) => {
        if (!entry.value) return true;

        const tags = getTags(entry.value);
        const hasNoAuthor = tags.some((tag) => NO_AUTHOR_TAGS.has(tag));
        if (!hasNoAuthor) return true;

        const hasAuthor = tags.some((tag) => isAuthorTag(tag));
        const authorTokens = extractAuthorTokens(entry.value, entry.fallbackAuthorId);
        return hasAuthor && authorTokens.length > 0;
    });

    conditions.push(noAuthorTagInAuthorPair);

    const termTokenCounts = new Map<string, number>();
    entries.forEach((entry) => {
        if (!entry.value) return;
        extractTermTokens(entry.value, entry.key).forEach((token) => {
            termTokenCounts.set(token, (termTokenCounts.get(token) || 0) + 1);
        });
    });
    const duplicateTermTokensCount = countDuplicateTokens(termTokenCounts);
    conditions.push(duplicateTermTokensCount === 0);

    const themesGroup1 = collectByKeys(
        entriesMap,
        THEME_GROUP_1_KEYS,
        (entry, fallback) => extractThemeTokens(entry.value, fallback)
    );
    const themesGroup2 = collectByKeys(
        entriesMap,
        THEME_GROUP_2_KEYS,
        (entry, fallback) => extractThemeTokens(entry.value, fallback)
    );
    const themesGroup3 = collectByKeys(
        entriesMap,
        THEME_GROUP_3_KEYS,
        (entry, fallback) => extractThemeTokens(entry.value, fallback)
    );

    conditions.push(themesGroup1.size >= 1);
    conditions.push(themesGroup2.size >= 1);
    conditions.push(themesGroup3.size >= 1);


    const themeTokenCounts = new Map<string, number>();
    const allExcerptThemeTokens = getEntityThemeTokens(variant.excerpt);
    allExcerptThemeTokens.forEach((token) => {
        themeTokenCounts.set(token, (themeTokenCounts.get(token) || 0) + 1);
    });
    const allPoemThemeTokens = getEntityThemeTokens(variant.poem);
    allPoemThemeTokens.forEach((token) => {
        themeTokenCounts.set(token, (themeTokenCounts.get(token) || 0) + 1);
    });
    entries.forEach((entry) => {
        if (!entry.value) return;
        extractThemeTokens(entry.value, entry.key).forEach((token) => {
            themeTokenCounts.set(token, (themeTokenCounts.get(token) || 0) + 1);
        });
    });
    const duplicateThemeTokensCount = countDuplicateTokens(themeTokenCounts);
    conditions.push(duplicateThemeTokensCount === 0);

    const excerptThemeSet = new Set(allExcerptThemeTokens);
    const crossBlockThemeOverlapCount = allPoemThemeTokens.filter((t) => excerptThemeSet.has(t)).length;
    conditions.push(crossBlockThemeOverlapCount === 0);

    const authorTokenCounts = new Map<string, number>();
    parseIdentifierTokens(variant.work.authorId).forEach((token) => {
        authorTokenCounts.set(token, (authorTokenCounts.get(token) || 0) + 1);
    });
    parseIdentifierTokens(variant.poet.authorId).forEach((token) => {
        authorTokenCounts.set(token, (authorTokenCounts.get(token) || 0) + 1);
    });
    entries.forEach((entry) => {
        if (!entry.value) return;
        extractAuthorTokens(entry.value).forEach((token) => {
            authorTokenCounts.set(token, (authorTokenCounts.get(token) || 0) + 1);
        });
    });
    const duplicateAuthorTokensCount = countDuplicateTokens(authorTokenCounts);
    conditions.push(duplicateAuthorTokensCount === 0);

    const block11Rods: string[] = [];
    [
        variant.task11_1,
        variant.task11_2,
        variant.task11_3,
        variant.task11_4,
        variant.task11_5,
    ].forEach((question) => {
        if (!question) return;
        block11Rods.push(...extractRodTokens(question));
    });

    const block11RodCounts = new Map<string, number>();
    block11Rods.forEach((rod) => {
        block11RodCounts.set(rod, (block11RodCounts.get(rod) || 0) + 1);
    });
    const block11RodDuplicateCount = Array.from(block11RodCounts.entries())
        .reduce((accumulator, [rod, count]) => accumulator + (ROD_SINGLE_USE_IN_BLOCK11.has(rod) ? Math.max(0, count - 1) : 0), 0);

    const block11RodUniqueness = Array.from(block11RodCounts.entries())
        .every(([rod, count]) => !ROD_SINGLE_USE_IN_BLOCK11.has(rod) || count <= 1);

    const block11RequiredRodCoverage = Array.from(ROD_SINGLE_USE_IN_BLOCK11)
        .every((rod) => (block11RodCounts.get(rod) || 0) >= 1);
    conditions.push(block11RodUniqueness);
    conditions.push(block11RequiredRodCoverage);

    const serviceTagsOnlyInTask3And6 = entries.every((entry) => {
        if (!entry.value) return true;
        const serviceTags = extractServiceTags(entry.value);
        if (!serviceTags.length) return true;
        return SERVICE_TAG_ALLOWED_KEYS.has(entry.key);
    });

    const serviceTagUniqueness = entries.every((entry) => {
        if (!entry.value) return true;
        const perTaskCounts = new Map<string, number>();
        extractServiceTags(entry.value).forEach((tag) => {
            perTaskCounts.set(tag, (perTaskCounts.get(tag) || 0) + 1);
        });
        return Array.from(perTaskCounts.values()).every((count) => count <= 1);
    });
    conditions.push(serviceTagsOnlyInTask3And6 && serviceTagUniqueness);

    const characterTagsOnlyInAllowedTasks = entries.every((entry) => {
        if (!entry.value) return true;
        if (!hasCharacterTag(entry.value)) return true;
        return CHARACTER_TAG_ALLOWED_KEYS.has(entry.key);
    });

    const characterTagCount = entries
        .filter((entry) => entry.value && CHARACTER_TAG_ALLOWED_KEYS.has(entry.key) && hasCharacterTag(entry.value))
        .length;

    conditions.push(characterTagsOnlyInAllowedTasks && characterTagCount <= 1);

    const customTagCounts = new Map<string, number>();
    entries.forEach((entry) => {
        if (!entry.value) return;
        extractCustomInternalTags(entry.value).forEach((tag) => {
            customTagCounts.set(tag, (customTagCounts.get(tag) || 0) + 1);
        });
    });

    const duplicateCustomTagsCount = Array.from(customTagCounts.values())
        .reduce((accumulator, count) => accumulator + Math.max(0, count - 1), 0);
    const customTagsUnique = duplicateCustomTagsCount === 0;
    conditions.push(customTagsUnique);

    const block11KeySet = new Set<VariantTaskKey>(BLOCK11_KEYS);
    const block11AuthorCounts = new Map<string, number>();
    entries.forEach((entry) => {
        if (!entry.value) return;
        if (!block11KeySet.has(entry.key)) return;

        extractAuthorTokens(entry.value).forEach((token) => {
            block11AuthorCounts.set(token, (block11AuthorCounts.get(token) || 0) + 1);
        });
    });
    const block11AuthorsUnique = countDuplicateTokens(block11AuthorCounts) === 0;
    conditions.push(block11AuthorsUnique);

    const block11ExclusiveQuestionsCount = entries
        .filter((entry) => entry.value && block11KeySet.has(entry.key) && isExclusiveQuestion(entry.value))
        .length;
    conditions.push(block11ExclusiveQuestionsCount === 1);

    const block11SpecialCoverageCount = new Set([
        ...Array.from(block11RodCounts.keys()).filter((token) => ROD_SINGLE_USE_IN_BLOCK11.has(token)),
        ...(block11ExclusiveQuestionsCount > 0 ? ['искл вопрос'] : []),
    ]).size;

    const score = conditions.reduce((accumulator, isMatched) => accumulator + (isMatched ? 1 : 0), 0);
    const criticalDuplicateTokensCount = duplicateTermTokensCount
        + duplicateCustomTagsCount
        + duplicateThemeTokensCount
        + duplicateAuthorTokensCount
        + block11RodDuplicateCount
        + crossBlockThemeOverlapCount;

    return {
        ok: conditions.every(Boolean),
        score,
        duplicateCustomTagsCount,
        duplicateTermTokensCount,
        duplicateThemeTokensCount,
        duplicateAuthorTokensCount,
        block11RodDuplicateCount,
        block11SpecialCoverageCount,
        criticalDuplicateTokensCount,
    };
};

export type VariantRulesEvaluation = ReturnType<typeof evaluateVariantRules>;

export const isBetterEvaluation = (
    next: VariantRulesEvaluation,
    current: VariantRulesEvaluation,
): boolean => {
    if (next.ok !== current.ok) {
        return next.ok;
    }

    if (next.criticalDuplicateTokensCount !== current.criticalDuplicateTokensCount) {
        return next.criticalDuplicateTokensCount < current.criticalDuplicateTokensCount;
    }

    if (next.duplicateTermTokensCount !== current.duplicateTermTokensCount) {
        return next.duplicateTermTokensCount < current.duplicateTermTokensCount;
    }

    if (next.duplicateCustomTagsCount !== current.duplicateCustomTagsCount) {
        return next.duplicateCustomTagsCount < current.duplicateCustomTagsCount;
    }

    if (next.duplicateThemeTokensCount !== current.duplicateThemeTokensCount) {
        return next.duplicateThemeTokensCount < current.duplicateThemeTokensCount;
    }

    if (next.duplicateAuthorTokensCount !== current.duplicateAuthorTokensCount) {
        return next.duplicateAuthorTokensCount < current.duplicateAuthorTokensCount;
    }

    if (next.block11SpecialCoverageCount !== current.block11SpecialCoverageCount) {
        return next.block11SpecialCoverageCount > current.block11SpecialCoverageCount;
    }

    return next.score > current.score;
};

export const getBlock3QuestionTokens = (question: Block3Question): Set<string> => {
    return new Set([
        ...extractAuthorTokens(question),
        ...extractTermTokens(question, 'task11'),
        ...extractBlock11SpecialTokens(question),
        ...extractCustomInternalTags(question),
    ]);
};

export const getTokenOverlapCount = (left: Set<string>, right: Set<string>): number => {
    let overlap = 0;
    left.forEach((token) => {
        if (right.has(token)) overlap += 1;
    });
    return overlap;
};

export const getBlock3PairScore = (first: Block3Question, second: Block3Question): number => {
    const firstTokens = getBlock3QuestionTokens(first);
    const secondTokens = getBlock3QuestionTokens(second);
    const tokenOverlap = getTokenOverlapCount(firstTokens, secondTokens);

    const firstAuthors = new Set(extractAuthorTokens(first));
    const secondAuthors = new Set(extractAuthorTokens(second));
    const authorOverlap = getTokenOverlapCount(firstAuthors, secondAuthors);

    return authorOverlap * 100 + tokenOverlap;
};

export const hasBlock3AuthorOverlap = (first: Block3Question, second: Block3Question): boolean => {
    const firstAuthors = new Set(extractAuthorTokens(first));
    const secondAuthors = new Set(extractAuthorTokens(second));
    return getTokenOverlapCount(firstAuthors, secondAuthors) > 0;
};


export const pickBlock3Pair = (items: Block3Question[]): [Block3Question | null, Block3Question | null] => {
    if (!items.length) return [null, null];
    if (items.length === 1) return [items[0], null];

    const source = shuffle(items);
    const pairs: Array<{ first: Block3Question; second: Block3Question; score: number; authorOverlap: boolean }> = [];

    for (let firstIndex = 0; firstIndex < source.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < source.length; secondIndex += 1) {
            const first = source[firstIndex];
            const second = source[secondIndex];
            const score = getBlock3PairScore(first, second);
            const authorOverlap = hasBlock3AuthorOverlap(first, second);
            pairs.push({ first, second, score, authorOverlap });
        }
    }

    const noAuthorOverlapPairs = pairs.filter((entry) => !entry.authorOverlap);
    if (noAuthorOverlapPairs.length) {
        const sorted = [...noAuthorOverlapPairs].sort((left, right) => left.score - right.score);
        const bestScore = sorted[0].score;
        const nearBest = sorted.filter((entry) => entry.score <= bestScore + 1);
        const topPool = nearBest.slice(0, 8);
        const picked = pickRandom(topPool);
        if (picked) {
            return [picked.first, picked.second];
        }
    }

    if (pairs.length) {
        const sorted = [...pairs].sort((left, right) => left.score - right.score);
        const picked = pickRandom(sorted.slice(0, 5)) || sorted[0];
        return [picked.first, null];
    }

    const first = pickRandom(items);
    return first ? [first, null] : [null, null];
};

export const pickTwoDistinctBlock3Questions = pickBlock3Pair;

export const buildVariantCandidate = (
    chosenWork: Work,
    chosenExcerpt: Excerpt,
    chosenPoet: Poet,
    chosenPoem: Poem,
    block3: Block3Data,
    works: Work[],
    poets: Poet[],
    task1Filters: Task1Filters,
    selectedThemeId: string,
    selectedBlock3AuthorId: string,
): GeneratedVariant => {
    const workPools = buildTaskPools(chosenWork, chosenExcerpt, task1Filters, works);
    const poemPools = buildPoemPools(chosenPoem, poets, selectedThemeId);
    const block3Pools = buildBlock3Pools(block3, selectedBlock3AuthorId, [chosenWork.authorId, chosenPoet.authorId]);

    const task8 = pickRandom(poemPools.task8);
    const task8Options = buildTask8Options(task8);
    const [task11_2, task11_3] = pickTwoDistinctBlock3Questions(block3Pools.task11_2_3);
    const task2 = shuffle(workPools.task2)
        .map((question) => buildRuntimeTask2(chosenWork, question, chosenExcerpt.tasks))
        .find((question): question is MatchingQuestion => question !== null) || null;
    const task3Runtime = buildRuntimeTwoGap(workPools.task3, 'task3');

    return {
        work: chosenWork,
        excerpt: chosenExcerpt,
        task1: pickRandom(workPools.task1),
        task2,
        task3: task3Runtime,
        task4_1: pickRandom(workPools.task4_1),
        task4_2: pickRandom(workPools.task4_2),
        task5: pickRandom(workPools.task5),
        poet: chosenPoet,
        poem: chosenPoem,
        task6: buildRuntimeTwoGap(poemPools.task6, 'task6'),
        task7: pickRandom(poemPools.task7),
        task8,
        task8Options,
        task9_1: pickRandom(poemPools.task9_1),
        task9_2: pickRandom(poemPools.task9_2),
        task10: pickRandom(poemPools.task10),
        task11_1: pickRandom(block3Pools.task11_1),
        task11_2,
        task11_3,
        task11_4: pickRandom(block3Pools.task11_4),
        task11_5: pickRandom(block3Pools.task11_5),
    };
};

export const generateVariantLocally = (
    chosenWork: Work,
    chosenExcerpt: Excerpt,
    chosenPoet: Poet,
    chosenPoem: Poem,
    block3: Block3Data,
    works: Work[],
    poets: Poet[],
    task1Filters: Task1Filters,
    selectedThemeId: string,
    selectedBlock3AuthorId: string,
): GeneratedVariant => {
    let bestVariant: GeneratedVariant | null = null;

    for (let attempt = 0; attempt < VARIANT_BUILD_ATTEMPTS; attempt += 1) {
        const candidate = buildVariantCandidate(
            chosenWork,
            chosenExcerpt,
            chosenPoet,
            chosenPoem,
            block3,
            works,
            poets,
            task1Filters,
            selectedThemeId,
            selectedBlock3AuthorId,
        );

        const evaluation = evaluateVariantRules(candidate);
        if (evaluation.ok) {
            return candidate;
        }

        if (!bestVariant) {
            bestVariant = candidate;
            continue;
        }

        const bestEvaluation = evaluateVariantRules(bestVariant);
        if (isBetterEvaluation(evaluation, bestEvaluation)) {
            bestVariant = candidate;
        }
    }

    return bestVariant || buildVariantCandidate(
        chosenWork,
        chosenExcerpt,
        chosenPoet,
        chosenPoem,
        block3,
        works,
        poets,
        task1Filters,
        selectedThemeId,
        selectedBlock3AuthorId,
    );
};


export function buildRuntimeTwoGapTask(
    taskKey: 'task3' | 'task6',
    id1: string,
    id2: string | null,
    works: Work[],
    poets: Poet[],
): TwoGapQuestion | null {
    const findEntry = (id: string): TwoGapQuestion | null => {
        if (taskKey === 'task3') {
            for (const work of works) {
                const found = work.commonTasks.task3.find((q) => String(q.id) === id);
                if (found) return found;
                for (const excerpt of work.excerpts) {
                    const found2 = (excerpt.tasks.customTask3 ?? []).find((q) => String(q.id) === id);
                    if (found2) return found2;
                }
            }
        } else {
            for (const poet of poets) {
                for (const poem of poet.poems) {
                    const found = (poem.tasks.task6 ?? []).find((q) => String(q.id) === id);
                    if (found) return found;
                }
            }
        }
        return null;
    };

    const primary = findEntry(id1);
    if (!primary) return null;

    if (id2) {
        const secondary = findEntry(id2);
        if (!secondary) return null;
        return {
            id: `${taskKey}-${id1}-${id2}`,
            part1: primary.part1 || '',
            part2: String(secondary.part1 || '').trim() || '_____',
            answer1: primary.answer1 || '',
            answer2: secondary.answer1 || '',
            termId1: primary.termId1,
            termId2: secondary.termId1,
            tags: [primary.tags, secondary.tags].filter(Boolean).join(', '),
            withoutAuthor: !!(primary.withoutAuthor || secondary.withoutAuthor),
        };
    }

    const hasOwn = !!(
        (primary.part2 || '').trim() ||
        (primary.answer2 || '').trim() ||
        (primary.termId2 || '').trim()
    );

    return {
        id: `${taskKey}-${id1}`,
        part1: primary.part1 || '',
        part2: hasOwn ? (String(primary.part2 || '').trim() || '_____') : '_____',
        answer1: primary.answer1 || '',
        answer2: hasOwn ? (primary.answer2 || '') : '',
        termId1: primary.termId1,
        termId2: hasOwn ? (primary.termId2 || '') : '',
        tags: primary.tags,
        withoutAuthor: primary.withoutAuthor,
    };
}

export function findTaskByIdInPools(
    taskKey: string,
    taskId: string,
    works: Work[],
    poets: Poet[],
    block3: Block3Data | null,
): unknown | null {
    const id = taskId.trim();
    if (!id) return null;

    const matchId = (q: { id?: string }) => q.id === id;

    if (taskKey === 'task1' || taskKey === 'task2' || taskKey === 'task3') {
        const commonKey = taskKey as 'task1' | 'task2' | 'task3';
        const customKey = `customTask${taskKey.replace('task', '')}` as 'customTask1' | 'customTask2' | 'customTask3';
        for (const work of works) {
            const found = work.commonTasks[commonKey].find(matchId);
            if (found) return found;
            for (const excerpt of work.excerpts) {
                const pool = excerpt.tasks[customKey];
                if (Array.isArray(pool)) {
                    const found2 = pool.find(matchId);
                    if (found2) return found2;
                }
            }
        }
        return null;
    }
    if (taskKey === 'task4_1' || taskKey === 'task4_2' || taskKey === 'task5') {
        const excerptKey = taskKey as keyof import('@/mocks/materials').ExcerptTasks;
        for (const work of works) {
            for (const excerpt of work.excerpts) {
                const pool = excerpt.tasks[excerptKey];
                if (Array.isArray(pool)) {
                    const found = (pool as Array<{ id?: string }>).find(matchId);
                    if (found) return found;
                }
            }
        }
        return null;
    }

    if (['task6', 'task7', 'task8', 'task9_1', 'task9_2', 'task10'].includes(taskKey)) {
        const poemKey = taskKey as keyof import('@/mocks/materials').PoemTasks;
        for (const poet of poets) {
            for (const poem of poet.poems) {
                const pool = poem.tasks[poemKey];
                if (Array.isArray(pool)) {
                    const found = (pool as Array<{ id?: string }>).find(matchId);
                    if (found) return found;
                }
            }
        }
        return null;
    }

    if (!block3) return null;
    if (taskKey === 'task11_1') return block3.task11_1.find(matchId) ?? null;
    if (taskKey === 'task11_2' || taskKey === 'task11_3') return block3.task11_2_3.find(matchId) ?? null;
    if (taskKey === 'task11_4') return block3.task11_4.find(matchId) ?? null;
    if (taskKey === 'task11_5') return block3.task11_5.find(matchId) ?? null;

    return null;
}


export const isNoFurtherVariantsMessage = (message: string): boolean => {
    const normalized = message.toLowerCase();
    return normalized.includes('подходящих замен')
        || normalized.includes('других вариантов')
        || normalized.includes('нет доступных')
        || normalized.includes('больше нет подходящих');
};
