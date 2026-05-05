import {
    TASK2_DEFAULT_CHARACTER_COUNT,
    TASK8_MAX_CORRECT_OPTIONS,
    TASK8_MAX_OPTIONS,
    TASK8_MIN_CORRECT_OPTIONS,
} from '@/consts/lib/variantStats';
import type {
    Excerpt,
    ExcerptTasks,
    MatchingQuestion,
    MultiSelectOption,
    MultiSelectQuestion,
    Poet,
    Poem,
    TwoGapQuestion,
    Work,
} from '@/mocks/materials';
import type { KnowledgeBasePayload } from '@/lib/knowledgeBaseApi';

type ActiveRecord = { isActive?: boolean };
type Task2PropertyCategory = 'phrases' | 'characteristics';
type QuestionTermSource = {
    termId?: unknown;
    termId1?: unknown;
    termId2?: unknown;
    tags?: unknown;
};

const filterActiveItems = <T extends ActiveRecord>(items: T[] | undefined | null): T[] => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => item?.isActive !== false);
};

const splitTokens = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.flatMap((entry) => splitTokens(entry));
    }

    return String(value || '')
        .split(/[,\n;]+/u)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
};

const buildIdentifierExclusionSet = (value: unknown): Set<string> => {
    return new Set(splitTokens(value));
};

const extractTermTokens = (question: QuestionTermSource): Set<string> => {
    const tokens = new Set<string>();

    splitTokens(question.termId).forEach((token) => tokens.add(token));
    splitTokens(question.termId1).forEach((token) => tokens.add(token));
    splitTokens(question.termId2).forEach((token) => tokens.add(token));

    splitTokens(question.tags)
        .filter((tag) => tag.startsWith('термин:'))
        .flatMap((tag) => splitTokens(tag.slice('термин:'.length)))
        .forEach((token) => tokens.add(token));

    return tokens;
};

const extractTwoGapTags = (entry: TwoGapQuestion): Set<string> => {
    return new Set(
        splitTokens(entry.tags)
            .map((tag) => tag.replace(/^#+/u, ''))
            .filter(Boolean),
    );
};

const hasTokenOverlap = (left: Set<string>, right: Set<string>): boolean => {
    for (const token of left) {
        if (right.has(token)) return true;
    }
    return false;
};

const isTwoGapValid = (entry: TwoGapQuestion | null | undefined): entry is TwoGapQuestion => {
    if (!entry) return false;

    const part1 = String(entry.part1 || '').trim();
    const answer1 = String(entry.answer1 || '').trim();
    const part2 = String(entry.part2 || '').trim();
    const answer2 = String(entry.answer2 || '').trim();

    if (!part1 || !answer1) return false;

    const singleLength = answer1.length + answer2.length;
    return singleLength <= 17 && (!part2 || !!answer2 || part2.includes('_'));
};

const hasOwnSecondGap = (entry: TwoGapQuestion): boolean => {
    return Boolean(entry.part2?.trim() || entry.answer2?.trim() || entry.termId2?.trim());
};

const buildRuntimeTwoGapCount = (entries: TwoGapQuestion[]): bigint => {
    const validEntries = entries.filter(isTwoGapValid);
    if (!validEntries.length) return BigInt(0);

    let pairedCount = BigInt(0);
    const standaloneCount = BigInt(validEntries.filter((entry) => hasOwnSecondGap(entry)).length);
    const pairableEntries = validEntries.filter((entry) => !hasOwnSecondGap(entry));

    for (let firstIndex = 0; firstIndex < pairableEntries.length; firstIndex += 1) {
        const first = pairableEntries[firstIndex];
        const firstTerms = extractTermTokens(first);
        const firstTags = extractTwoGapTags(first);

        for (let secondIndex = 0; secondIndex < pairableEntries.length; secondIndex += 1) {
            const second = pairableEntries[secondIndex];
            if (first.id === second.id) continue;

            const combinedAnswerLength = `${first.answer1 || ''}${second.answer1 || ''}`.trim().length;
            if (combinedAnswerLength > 17) continue;

            if (
                hasTokenOverlap(firstTerms, extractTermTokens(second))
                || hasTokenOverlap(firstTags, extractTwoGapTags(second))
            ) {
                continue;
            }

            pairedCount += BigInt(1);
        }
    }

    return pairedCount > BigInt(0) ? pairedCount + standaloneCount : BigInt(validEntries.length);
};

const normalizeTask2Comparable = (value: string): string => value.trim().toLowerCase();

const getPairPropertiesByCategory = (pair: MatchingQuestion['pairs'][number], category: Task2PropertyCategory): string[] => {
    const direct = pair.properties
        .map((property) => property.trim())
        .filter(Boolean);

    if (direct.length) {
        return direct;
    }

    if (category === 'phrases') {
        return (pair.phrases || []).map((property) => property.trim()).filter(Boolean);
    }

    return (pair.characteristics || []).map((property) => property.trim()).filter(Boolean);
};

const resolveTask2PropertyCategories = (question: MatchingQuestion, work: Work): Task2PropertyCategory[] => {
    if (question.pairPropertyType === 'phrases' || question.pairPropertyType === 'characteristics') {
        return [question.pairPropertyType];
    }

    if (question.characterSource === 'quotes') return ['phrases'];
    if (question.characterSource === 'facts') return ['characteristics'];

    const categories: Task2PropertyCategory[] = [];
    const hasPhrases = question.pairs.some((pair) => getPairPropertiesByCategory(pair, 'phrases').length > 0)
        || work.characters.some((character) => character.quotes.some((quote) => quote.trim()));
    const hasCharacteristics = question.pairs.some((pair) => getPairPropertiesByCategory(pair, 'characteristics').length > 0)
        || work.characters.some((character) => character.facts.some((fact) => fact.trim()));

    if (hasPhrases) categories.push('phrases');
    if (hasCharacteristics) categories.push('characteristics');

    return categories.length ? categories : ['phrases'];
};

const parsePositiveInteger = (value: unknown): number | null => {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(numeric) || numeric <= 0) return null;
    return numeric;
};

const combinationCount = (total: number, selected: number): bigint => {
    if (selected < 0 || total < 0 || selected > total) return BigInt(0);
    if (selected === 0 || selected === total) return BigInt(1);

    const safeSelected = Math.min(selected, total - selected);
    let result = BigInt(1);
    for (let index = 1; index <= safeSelected; index += 1) {
        result = (result * BigInt(total - safeSelected + index)) / BigInt(index);
    }
    return result;
};

const countTask2VariantsForCategory = (
    work: Work,
    question: MatchingQuestion,
    category: Task2PropertyCategory,
    excerptTasks?: ExcerptTasks,
): bigint => {
    const excludedCharacters = new Set(splitTokens(excerptTasks?.excludeTask2Characters).map(normalizeTask2Comparable));
    const excludedProperties = new Set(splitTokens(excerptTasks?.excludeTask2Properties).map(normalizeTask2Comparable));
    const configuredCount = parsePositiveInteger(question.characterCount) || TASK2_DEFAULT_CHARACTER_COUNT;

    const preparedPairs = question.pairs
        .map((pair) => {
            if (excludedCharacters.has(normalizeTask2Comparable(pair.character))) {
                return null;
            }

            const availableProperties = getPairPropertiesByCategory(pair, category)
                .filter((property) => !excludedProperties.has(normalizeTask2Comparable(property)));

            if (!availableProperties.length) {
                const character = work.characters.find((entry) => normalizeTask2Comparable(entry.name) === normalizeTask2Comparable(pair.character));
                const fallbackProperties = (category === 'phrases' ? character?.quotes : character?.facts) || [];
                const hasFallback = fallbackProperties
                    .map((property) => property.trim())
                    .filter(Boolean)
                    .some((property) => !excludedProperties.has(normalizeTask2Comparable(property)));
                if (!hasFallback) {
                    return null;
                }
            }

            return pair;
        })
        .filter((pair): pair is MatchingQuestion['pairs'][number] => pair !== null);

    if (preparedPairs.length) {
        const selectedCount = Math.min(configuredCount, preparedPairs.length);
        return selectedCount > 0 ? combinationCount(preparedPairs.length, selectedCount) : BigInt(0);
    }

    const availableCharacters = work.characters.filter((character) => {
        if (excludedCharacters.has(normalizeTask2Comparable(character.name))) {
            return false;
        }

        const properties = category === 'phrases' ? character.quotes : character.facts;
        return properties
            .map((property) => property.trim())
            .filter(Boolean)
            .some((property) => !excludedProperties.has(normalizeTask2Comparable(property)));
    });

    const selectedCount = Math.min(configuredCount, availableCharacters.length);
    return selectedCount > 0 ? combinationCount(availableCharacters.length, selectedCount) : BigInt(0);
};

const countValidTask2Variants = (
    work: Work,
    task2Pool: MatchingQuestion[],
    excerptTasks?: ExcerptTasks,
): bigint => {
    return task2Pool.reduce((total, question) => {
        const categoryCount = resolveTask2PropertyCategories(question, work)
            .reduce<bigint>((sum, category) => sum + countTask2VariantsForCategory(work, question, category, excerptTasks), BigInt(0));
        return total + categoryCount;
    }, BigInt(0));
};

const buildExcerptTaskPools = (work: Work, excerpt: Excerpt, works: Work[]) => {
    const task1IdExclusions = new Set(excerpt.tasks.excludeTask1Ids || []);
    const task1TermExclusions = buildIdentifierExclusionSet(excerpt.tasks.excludeTask1TermIds);
    const task2IdExclusions = new Set(excerpt.tasks.excludeTask2Ids || []);
    const task2TermExclusions = buildIdentifierExclusionSet(excerpt.tasks.excludeTask2TermIds);
    const task3IdExclusions = new Set(excerpt.tasks.excludeTask3Ids || []);
    const task3TermExclusions = buildIdentifierExclusionSet(excerpt.tasks.excludeTask3TermIds);

    const task1 = [
        ...filterActiveItems(work.commonTasks.task1).filter((question) => (
            !task1IdExclusions.has(question.id) && !hasTokenOverlap(extractTermTokens(question), task1TermExclusions)
        )),
        ...filterActiveItems(excerpt.tasks.customTask1),
    ];

    const task2 = [
        ...filterActiveItems(work.commonTasks.task2).filter((question) => (
            !task2IdExclusions.has(question.id) && !hasTokenOverlap(extractTermTokens(question), task2TermExclusions)
        )),
        ...filterActiveItems(excerpt.tasks.customTask2),
    ];

    const localTask3 = [
        ...filterActiveItems(work.commonTasks.task3).filter((question) => (
            !task3IdExclusions.has(question.id) && !hasTokenOverlap(extractTermTokens(question), task3TermExclusions)
        )),
        ...filterActiveItems(excerpt.tasks.customTask3),
    ].filter(isTwoGapValid);

    const globalTask3 = works
        .flatMap((entry) => filterActiveItems(entry.commonTasks.task3))
        .filter((entry) => Boolean(entry.withoutAuthor))
        .filter((entry) => !task3IdExclusions.has(entry.id))
        .filter((entry) => !hasTokenOverlap(extractTermTokens(entry), task3TermExclusions))
        .filter(isTwoGapValid);

    return {
        task1,
        task2,
        task3: [...localTask3, ...globalTask3],
        task4_1: filterActiveItems(excerpt.tasks.task4_1),
        task4_2: filterActiveItems(excerpt.tasks.task4_2),
        task5: filterActiveItems(excerpt.tasks.task5),
    };
};

const buildPoemPools = (poem: Poem, poets: Poet[]) => {
    const localTask6 = filterActiveItems(poem.tasks.task6).filter(isTwoGapValid);
    const globalTask6 = poets
        .flatMap((poet) => poet.poems)
        .flatMap((poemEntry) => filterActiveItems(poemEntry.tasks.task6))
        .filter((entry) => Boolean(entry.withoutAuthor))
        .filter(isTwoGapValid);

    return {
        task6: [...localTask6, ...globalTask6],
        task7: filterActiveItems(poem.tasks.task7),
        task8: filterActiveItems(poem.tasks.task8),
        task9_1: filterActiveItems(poem.tasks.task9_1),
        task9_2: filterActiveItems(poem.tasks.task9_2),
        task10: filterActiveItems(poem.tasks.task10),
    };
};

const optionKey = (option: MultiSelectOption) => `${option.termId || ''}::${option.term.trim()}`;

const countTask8Configurations = (question: MultiSelectQuestion): bigint => {
    const deduped = question.options
        .filter((option) => option.term.trim())
        .filter((option, index, array) => array.findIndex((entry) => optionKey(entry) === optionKey(option)) === index);

    const targetTotal = Math.min(TASK8_MAX_OPTIONS, deduped.length);
    const correctCount = deduped.filter((option) => Boolean(option.isCorrect)).length;
    const incorrectCount = deduped.length - correctCount;

    if (targetTotal <= 1 || correctCount <= 0 || incorrectCount <= 0) {
        return deduped.length ? BigInt(1) : BigInt(0);
    }

    const minCorrectByPool = Math.max(1, targetTotal - incorrectCount);
    const maxCorrectByPool = Math.min(correctCount, targetTotal - 1);
    const preferredMinCorrect = Math.min(TASK8_MIN_CORRECT_OPTIONS, targetTotal - 1);
    const preferredMaxCorrect = Math.min(TASK8_MAX_CORRECT_OPTIONS, targetTotal - 1);

    const minCorrect = Math.max(minCorrectByPool, preferredMinCorrect);
    const maxCorrect = Math.min(maxCorrectByPool, preferredMaxCorrect);

    if (minCorrect > maxCorrect) {
        const fallbackCorrectCount = Math.min(
            maxCorrectByPool,
            Math.max(minCorrectByPool, preferredMinCorrect),
        );

        return fallbackCorrectCount > 0
            ? combinationCount(correctCount, fallbackCorrectCount) * combinationCount(incorrectCount, targetTotal - fallbackCorrectCount)
            : BigInt(1);
    }

    let total = BigInt(0);
    for (let currentCorrect = minCorrect; currentCorrect <= maxCorrect; currentCorrect += 1) {
        total += combinationCount(correctCount, currentCorrect) * combinationCount(incorrectCount, targetTotal - currentCorrect);
    }

    return total > BigInt(0) ? total : BigInt(1);
};

const countBlock1Variants = (works: Work[]): bigint => {
    return works.reduce<bigint>((total, work) => {
        const excerptTotal = work.excerpts.reduce<bigint>((excerptCount, excerpt) => {
            if (!String(excerpt.text || '').trim()) return excerptCount;

            const pools = buildExcerptTaskPools(work, excerpt, works);
            const task1Count = BigInt(pools.task1.length);
            const task2Count = countValidTask2Variants(work, pools.task2, excerpt.tasks);
            const task3Count = buildRuntimeTwoGapCount(pools.task3);
            const task4_1Count = BigInt(Math.max(1, pools.task4_1.length));
            const task4_2Count = BigInt(Math.max(1, pools.task4_2.length));
            const hasAnyTask4 = pools.task4_1.length > 0 || pools.task4_2.length > 0;
            const task5Count = BigInt(pools.task5.length);

            if (task1Count === BigInt(0) || task2Count === BigInt(0) || task3Count === BigInt(0) || task5Count === BigInt(0) || !hasAnyTask4) {
                return excerptCount;
            }

            return excerptCount + (task1Count * task2Count * task3Count * task4_1Count * task4_2Count * task5Count);
        }, BigInt(0));

        return total + excerptTotal;
    }, BigInt(0));
};

const countBlock2Variants = (poets: Poet[]): bigint => {
    return poets.reduce<bigint>((total, poet) => {
        const poemTotal = poet.poems.reduce<bigint>((poemCount, poem) => {
            if (!String(poem.text || '').trim()) return poemCount;

            const pools = buildPoemPools(poem, poets);
            const task6Count = buildRuntimeTwoGapCount(pools.task6);
            const task7Count = BigInt(pools.task7.length);
            const task8Count = pools.task8.reduce<bigint>((sum, question) => sum + countTask8Configurations(question), BigInt(0));
            const task9_1Count = BigInt(Math.max(1, pools.task9_1.length));
            const task9_2Count = BigInt(Math.max(1, pools.task9_2.length));
            const hasAnyTask9 = pools.task9_1.length > 0 || pools.task9_2.length > 0;
            const task10Count = BigInt(pools.task10.length);

            if (task6Count === BigInt(0) || task7Count === BigInt(0) || task8Count === BigInt(0) || task10Count === BigInt(0) || !hasAnyTask9) {
                return poemCount;
            }

            return poemCount + (task6Count * task7Count * task8Count * task9_1Count * task9_2Count * task10Count);
        }, BigInt(0));

        return total + poemTotal;
    }, BigInt(0));
};

const countBlock3Variants = (payload: KnowledgeBasePayload): bigint => {
    const task11_1Count = filterActiveItems(payload.block3.task11_1).length;
    const task11_2_3Count = filterActiveItems(payload.block3.task11_2_3).length;
    const task11_4Count = filterActiveItems(payload.block3.task11_4).length;
    const task11_5Count = filterActiveItems(payload.block3.task11_5).length;

    if (!task11_1Count || task11_2_3Count < 2 || !task11_4Count || !task11_5Count) {
        return BigInt(0);
    }

    return BigInt(task11_1Count)
        * BigInt(task11_2_3Count)
        * BigInt(task11_2_3Count - 1)
        * BigInt(task11_4Count)
        * BigInt(task11_5Count);
};

const formatBigInt = (value: bigint): string => {
    const raw = value.toString();
    return raw.replace(/\B(?=(\d{3})+(?!\d))/gu, ' ');
};

export interface VariantStatsSummary {
    totalVariants: bigint;
    totalVariantsLabel: string;
    block1Variants: bigint;
    block2Variants: bigint;
    block3Variants: bigint;
}

export const calculateVariantStats = (payload: KnowledgeBasePayload): VariantStatsSummary => {
    const block1Variants = countBlock1Variants(payload.works);
    const block2Variants = countBlock2Variants(payload.poets);
    const block3Variants = countBlock3Variants(payload);
    const totalVariants = block1Variants * block2Variants * block3Variants;

    return {
        totalVariants,
        totalVariantsLabel: formatBigInt(totalVariants),
        block1Variants,
        block2Variants,
        block3Variants,
    };
};
