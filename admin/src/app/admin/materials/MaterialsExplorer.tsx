'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IoAddOutline, IoArrowBackOutline, IoTrashOutline } from 'react-icons/io5';

import AdminLayout from '@/components/layout/AdminLayout';
import Button from '@/components/shared/Button';
import Checkbox from '@/components/shared/Checkbox';
import { fetchKnowledgeBase, updateKnowledgeBase } from '@/lib/knowledgeBaseApi';
import type {
    Block3Data,
    Block3Question,
    Block3QuestionMultiAuthor,
    Character,
    EssayQuestion,
    Excerpt,
    ExcerptTasks,
    Id,
    MatchPair,
    MatchingQuestion,
    MultiSelectOption,
    MultiSelectQuestion,
    Poem,
    PoemTasks,
    Poet,
    ShortQuestion,
    TwoGapQuestion,
    Work,
    KnowledgeBaseSettings,
} from '@/mocks/materials';
import { DEFAULT_KNOWLEDGE_BASE_SETTINGS } from '@/mocks/materials';

type SectionKey = 'works' | 'poets' | 'block3' | 'settings';
type Block3Key = keyof Block3Data;
type WorkSubSectionKey = 'excerpts' | 'common-questions' | 'characters';
type PoetSubSectionKey = 'poems';
const COMMON_TASK_KEYS = ['task1', 'task2', 'task3'] as const;
type CommonTaskKey = typeof COMMON_TASK_KEYS[number];
const EXCERPT_TASK_KEYS = ['customTask1', 'customTask2', 'customTask3', 'task4_1', 'task4_2', 'task5'] as const;
type ExcerptTaskKey = typeof EXCERPT_TASK_KEYS[number];
const POEM_TASK_KEYS = ['task6', 'task7', 'task8', 'task9_1', 'task9_2', 'task10'] as const;
type PoemTaskKey = typeof POEM_TASK_KEYS[number];

type BreadcrumbSibling = {
    label: string;
    href: string;
};

type BreadcrumbItem = {
    label: string;
    href: string;
    siblings?: BreadcrumbSibling[];
    addLabel?: string;
    onAdd?: () => void;
};

const BLOCK3_LABELS: Record<Block3Key, string> = {
    task11_1: '11.1',
    task11_2_3: '11.2–11.3',
    task11_4: '11.4',
    task11_5: '11.5',
};
const COMMON_TASK_LABELS: Record<CommonTaskKey, string> = {
    task1: 'Задание 1',
    task2: 'Задание 2',
    task3: 'Задание 3',
};
const EXCERPT_TASK_LABELS: Record<ExcerptTaskKey, string> = {
    customTask1: 'Кастомные вопросы задания 1',
    customTask2: 'Кастомные вопросы задания 2',
    customTask3: 'Кастомные вопросы задания 3',
    task4_1: 'Задание 4.1',
    task4_2: 'Задание 4.2',
    task5: 'Задание 5',
};
const POEM_TASK_LABELS: Record<PoemTaskKey, string> = {
    task6: 'Задание 6',
    task7: 'Задание 7',
    task8: 'Задание 8',
    task9_1: 'Задание 9.1',
    task9_2: 'Задание 9.2',
    task10: 'Задание 10',
};
const COMMON_TASK_SET = new Set<string>(COMMON_TASK_KEYS);
const EXCERPT_TASK_SET = new Set<string>(EXCERPT_TASK_KEYS);
const POEM_TASK_SET = new Set<string>(POEM_TASK_KEYS);

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const normalizeNbsp = (value: string): string => value
    .replace(/&nbsp;?/giu, ' ')
    .replace(/\u00A0/gu, ' ');

const decodeSegment = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const buildMaterialsHref = (...segments: string[]) => {
    if (!segments.length) return '/admin/materials';
    return `/admin/materials/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
};
const buildNestedMaterialsHref = (baseHref: string, ...segments: string[]) => (
    buildMaterialsHref(...baseHref.split('/').filter(Boolean).slice(2), ...segments)
);
const parseIndexSegment = (value: string | undefined) => {
    if (value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
};
const isCommonTaskKey = (value: string | undefined): value is CommonTaskKey => Boolean(value && COMMON_TASK_SET.has(value));
const isExcerptTaskKey = (value: string | undefined): value is ExcerptTaskKey => Boolean(value && EXCERPT_TASK_SET.has(value));
const isPoemTaskKey = (value: string | undefined): value is PoemTaskKey => Boolean(value && POEM_TASK_SET.has(value));

const createEmptyWork = (): Work => ({
    id: createId('work'),
    title: 'Новое произведение',
    author: '',
    authorId: '',
    workId: createId('work-id'),
    age18: false,
    internalTags: '',
    externalTags: '',
    commonTasks: {
        task1: [],
        task2: [],
        task3: [],
    },
    characters: [],
    excerpts: [],
});

const createEmptyExcerpt = (order: number): Excerpt => ({
    id: createId('excerpt'),
    order,
    title: `Отрывок ${order}`,
    chapter: '',
    excerptId: createId('excerpt-id'),
    text: '',
    textColumns: 1,
    textSecondColumn: '',
    tasks: {
        excludeTask1Ids: [],
        excludeTask1TermIds: [],
        excludeTask2Ids: [],
        excludeTask2TermIds: [],
        excludeTask2Characters: [],
        excludeTask2Properties: [],
        excludeTask3Ids: [],
        excludeTask3TermIds: [],
        customTask1: [],
        customTask2: [],
        customTask3: [],
        task4_1: [],
        task4_2: [],
        task5: [],
    },
});

const sortByExcerptOrder = (items: Excerpt[]): Excerpt[] => {
    return [...items].sort((left, right) => left.order - right.order);
};

const normalizeExcerptsOrder = (items: Excerpt[]): Excerpt[] => {
    return sortByExcerptOrder(items).map((item, index) => ({ ...item, order: index + 1 }));
};

const insertExcerptAtOrder = (items: Excerpt[], nextExcerpt: Excerpt, desiredOrder: number): Excerpt[] => {
    const normalized = normalizeExcerptsOrder(items.filter((item) => item.id !== nextExcerpt.id));
    const normalizedOrder = Number.isFinite(desiredOrder) ? Math.max(1, Math.floor(desiredOrder)) : normalized.length + 1;
    const insertionIndex = Math.min(normalized.length, normalizedOrder - 1);
    const result = [...normalized];
    result.splice(insertionIndex, 0, { ...nextExcerpt });
    return result.map((item, index) => ({ ...item, order: index + 1 }));
};

const moveExcerptToOrder = (items: Excerpt[], excerptId: string, desiredOrder: number): Excerpt[] => {
    const target = items.find((item) => item.id === excerptId);
    if (!target) return normalizeExcerptsOrder(items);
    return insertExcerptAtOrder(items.filter((item) => item.id !== excerptId), target, desiredOrder);
};

const createEmptyPoet = (): Poet => ({
    id: createId('poet'),
    name: 'Новый автор',
    authorId: createId('author-id'),
    poems: [],
});

const createEmptyPoem = (): Poem => ({
    id: createId('poem'),
    title: 'Новое стихотворение',
    poemId: createId('poem-id'),
    text: '',
    textColumns: 1,
    textSecondColumn: '',
    age18: false,
    tasks: {
        task6: [],
        task7: [],
        task8: [],
        task9_1: [],
        task9_2: [],
        task10: [],
    },
});

const createEmptyBlock3Question = (key: Block3Key): Block3Question | Block3QuestionMultiAuthor => {
    if (key === 'task11_4') {
        return {
            id: createId('b3-11-4'),
            text: 'Новый вопрос 11.4',
            authorIds: [],
            termId: '',
            rodId: '',
            themeInternalId: '',
            publicId: '',
            tags: '',
            isActive: true,
        };
    }

    return {
        id: createId(`b3-${key}`),
        text: `Новый вопрос ${BLOCK3_LABELS[key]}`,
        workId: '',
        authorId: '',
        termId: '',
        rodId: '',
        questionId: '',
        special: false,
        themeInternalId: '',
        publicId: '',
        tags: '',
        isActive: true,
    };
};

const createShortQuestion = (prefix = 'sq'): ShortQuestion => ({
    id: createId(prefix),
    text: '',
    answer: '',
    termId: '',
    authorId: '',
    tags: '',
    isTermQuestion: false,
    isActive: true,
});

const createMatchPair = (): MatchPair => ({
    id: createId('pair'),
    character: '',
    properties: [],
    phrases: [],
    characteristics: [],
});

const createMatchingQuestion = (prefix = 'mq'): MatchingQuestion => ({
    id: createId(prefix),
    prompt: '',
    leftLabel: 'Левый столбец',
    rightLabel: 'Правый столбец',
    pairs: [],
    extraOption: '',
    termId: '',
    authorId: '',
    characterCount: undefined,
    characterSource: 'mixed',
    pairPropertyType: 'phrases',
    tags: '',
    isActive: true,
});

const createTwoGapQuestion = (prefix = 'tg'): TwoGapQuestion => ({
    id: createId(prefix),
    part1: '',
    part2: '',
    answer1: '',
    answer2: '',
    termId1: '',
    termId2: '',
    tags: '',
    isActive: true,
});

const createEssayQuestion = (prefix = 'essay'): EssayQuestion => ({
    id: createId(prefix),
    text: '',
    termId: '',
    authorId: '',
    theme1Id: '',
    theme2Id: '',
    similarityId: '',
    themeInternalId: '',
    publicId: '',
    tags: '',
    isActive: true,
});

const createCharacter = (): Character => ({
    id: createId('char'),
    name: '',
    tag: '',
    quotes: [],
    facts: [],
});

const createMultiSelectOption = (): MultiSelectOption => ({
    id: createId('ms-opt'),
    term: '',
    termId: '',
});

const createMultiSelectQuestion = (): MultiSelectQuestion => ({
    id: createId('msq'),
    prompt: '',
    options: [],
    termId: '',
    tags: '',
    isActive: true,
});

type ActivatableItem = {
    isActive?: boolean;
};

const isItemActive = (item: ActivatableItem | null | undefined): boolean => item?.isActive !== false;
const countActiveItems = (items: readonly ActivatableItem[]): number => items.filter((item) => isItemActive(item)).length;
const buildMetaParts = (items: Array<string | null | undefined | false>): string[] => items.filter(Boolean) as string[];
const DETAIL_META_GRID_CLASS = 'grid grid-cols-1 md:grid-cols-5 gap-3';
const DETAIL_FULL_WIDTH_CLASS = 'md:col-span-5';

function StatusChip({ isActive }: { isActive?: boolean }) {
    const active = isItemActive({ isActive });
    return (
        <span
            className={`mt-0.5 inline-flex h-2.5 w-2.5 rounded-full ${active ? 'bg-[#1F6A3A]' : 'bg-[#B8412F]'}`}
            title={active ? 'Активно' : 'Неактивно'}
            aria-label={active ? 'Активно' : 'Неактивно'}
        >
            <span className="sr-only">{active ? 'Активно' : 'Неактивно'}</span>
        </span>
    );
}

function StatusField({
    value,
    onChange,
}: {
    value?: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex flex-col gap-1">
            <FieldLabel>Статус</FieldLabel>
            <select
                value={isItemActive({ isActive: value }) ? 'active' : 'inactive'}
                onChange={(event) => onChange(event.target.value === 'active')}
                className="h-8 max-w-[140px] rounded-md border border-[#221E20]/15 bg-white px-2 text-xs outline-none focus:border-[#221E20]"
            >
                <option value="active">Вкл</option>
                <option value="inactive">Выкл</option>
            </select>
        </label>
    );
}

function CompactQuestionRow({
    index,
    title,
    meta,
    isActive,
    href,
    ariaLabel,
    onDelete,
}: {
    index: number;
    title: string;
    meta: string[];
    isActive?: boolean;
    href?: string;
    ariaLabel: string;
    onDelete: () => void;
}) {
    return (
        <div className={`relative rounded-lg border border-[#221E20]/10 bg-[#FCFCFA] px-3 py-2 ${href ? 'hover:border-[#221E20]/25 hover:bg-[#F8F7F4] transition-colors' : ''}`}>
            <div className="flex items-start gap-3">
                {href ? (
                    <Link href={href} aria-label={ariaLabel} className="flex min-w-0 flex-1 items-start gap-3 rounded-md">
                        <div className="flex min-w-[48px] items-center gap-2 pt-0.5">
                            <StatusChip isActive={isActive} />
                            <span className="text-[10px] font-bold uppercase tracking-wide opacity-45">#{index + 1}</span>
                        </div>
                        <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-medium text-[#221E20]">{title}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-tight opacity-60">
                                {meta.map((item) => (
                                    <span key={item}>{item}</span>
                                ))}
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div className="flex min-w-0 flex-1 items-start gap-3 rounded-md">
                        <div className="flex min-w-[48px] items-center gap-2 pt-0.5">
                            <StatusChip isActive={isActive} />
                            <span className="text-[10px] font-bold uppercase tracking-wide opacity-45">#{index + 1}</span>
                        </div>
                        <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-medium text-[#221E20]">{title}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-tight opacity-60">
                                {meta.map((item) => (
                                    <span key={item}>{item}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div className="shrink-0">
                    <Button variant="outlined" className="h-8 px-2 text-red-600 border-red-100" onClick={onDelete}>
                        <IoTrashOutline size={14} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <span className="text-[11px] font-bold uppercase opacity-60">{children}</span>;
}

function TextField({
    label,
    value,
    onChange,
    placeholder,
    compact = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    compact?: boolean;
}) {
    return (
        <label className={`flex flex-col gap-1 ${compact ? 'max-w-[240px]' : ''}`}>
            <FieldLabel>{label}</FieldLabel>
            <input
                value={value}
                onChange={(event) => onChange(normalizeNbsp(event.target.value))}
                placeholder={placeholder}
                className="h-[40px] rounded-lg border border-[#221E20]/15 bg-white px-3 text-sm outline-none focus:border-[#221E20]"
            />
        </label>
    );
}

function TextAreaField({
    label,
    value,
    onChange,
    rows = 4,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
}) {
    return (
        <div className="flex flex-col gap-1">
            <FieldLabel>{label}</FieldLabel>
            <textarea
                rows={rows}
                value={value}
                onChange={(event) => onChange(normalizeNbsp(event.target.value))}
                className="rounded-lg border border-[#221E20]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#221E20]"
            />
        </div>
    );
}

function RichTextField({
    label,
    value,
    onChange,
    minHeight = 220,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    minHeight?: number;
}) {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const lastAppliedValueRef = useRef<string>('');

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;
        const normalized = value || '';
        const isFocused = document.activeElement === editor;
        if (isFocused) {
            return;
        }
        if (editor.innerHTML !== normalized) {
            editor.innerHTML = normalized;
        }
        lastAppliedValueRef.current = normalized;
    }, [value]);

    const syncValue = () => {
        const editor = editorRef.current;
        if (!editor) return;
        const html = normalizeNbsp(editor.innerHTML === '<br>' ? '' : editor.innerHTML);
        if (html === lastAppliedValueRef.current) return;
        lastAppliedValueRef.current = html;
        onChange(html);
    };

    const runCommand = (command: string, commandValue?: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();
        document.execCommand(command, false, commandValue);
        syncValue();
    };

    const buttonClassName = 'h-[30px] min-w-[40px] rounded border border-[#221E20]/15 bg-white px-2 text-xs hover:border-[#221E20]/40';

    return (
        <div className="flex flex-col gap-1">
            <FieldLabel>{label}</FieldLabel>
            <div className="rounded-lg border border-[#221E20]/15 bg-white overflow-hidden">
                <div className="flex flex-wrap gap-1 border-b border-[#221E20]/10 bg-[#FAFAFA] px-2 py-2">
                    <button type="button" className={buttonClassName} onMouseDown={(event) => { event.preventDefault(); runCommand('bold'); }} title="Жирный">
                        Ж
                    </button>
                    <button type="button" className={buttonClassName} onMouseDown={(event) => { event.preventDefault(); runCommand('italic'); }} title="Курсив">
                        К
                    </button>
                    <button type="button" className={buttonClassName} onMouseDown={(event) => { event.preventDefault(); runCommand('underline'); }} title="Подчёркнутый">
                        Ч
                    </button>
                    <button type="button" className={buttonClassName} onMouseDown={(event) => { event.preventDefault(); runCommand('insertUnorderedList'); }} title="Маркированный список">
                        • Список
                    </button>
                    <button type="button" className={buttonClassName} onMouseDown={(event) => { event.preventDefault(); runCommand('insertOrderedList'); }} title="Нумерованный список">
                        1. Список
                    </button>
                    <button type="button" className={buttonClassName} onMouseDown={(event) => { event.preventDefault(); runCommand('justifyLeft'); }} title="Выравнивание по левому краю">
                        Лево
                    </button>
                    <button type="button" className={buttonClassName} onMouseDown={(event) => { event.preventDefault(); runCommand('justifyCenter'); }} title="Выравнивание по центру">
                        Центр
                    </button>
                    <button type="button" className={buttonClassName} onMouseDown={(event) => { event.preventDefault(); runCommand('justifyRight'); }} title="Выравнивание по правому краю">
                        Право
                    </button>
                    <button type="button" className={buttonClassName} onMouseDown={(event) => { event.preventDefault(); runCommand('justifyFull'); }} title="Выравнивание по ширине">
                        Ширина
                    </button>
                    <button type="button" className={buttonClassName} onMouseDown={(event) => { event.preventDefault(); runCommand('removeFormat'); }} title="Очистить форматирование">
                        Очистить
                    </button>
                </div>

                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={syncValue}
                    onBlur={syncValue}
                    className="px-3 py-2 text-sm leading-relaxed outline-none whitespace-pre-wrap break-words [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-1 [&_li]:my-0.5"
                    style={{ minHeight }}
                />
            </div>
        </div>
    );
}

const linesToArray = (value: string): string[] => (
    normalizeNbsp(value)
        .split(/\n+/u)
        .map((entry) => entry.replace(/\r/g, '').trim())
        .filter((entry) => entry.length > 0)
);
const arrayToLines = (value: string[] | undefined): string => (value || []).join('\n');

const stripHtmlTags = (value: string): string => normalizeNbsp(value).replace(/<[^>]*>/g, ' ');
const toQuestionPreview = (value: string, fallback: string): string => {
    const normalized = stripHtmlTags(value || '')
        .replace(/\s+/g, ' ')
        .trim();
    return normalized || fallback;
};

const getCommonTasksCountSignature = (tasks: Work['commonTasks']): string => {
    return [tasks.task1.length, tasks.task2.length, tasks.task3.length].join('|');
};

const getExcerptTasksCountSignature = (tasks: ExcerptTasks): string => {
    return [
        tasks.customTask1.length,
        tasks.customTask2.length,
        tasks.customTask3.length,
        tasks.task4_1.length,
        tasks.task4_2.length,
        tasks.task5.length,
    ].join('|');
};

const getPoemTasksCountSignature = (tasks: PoemTasks): string => {
    return [
        tasks.task6.length,
        tasks.task7.length,
        tasks.task8.length,
        tasks.task9_1.length,
        tasks.task9_2.length,
        tasks.task10.length,
    ].join('|');
};

function StringListField({
    label,
    value,
    onChange,
    rows = 4,
}: {
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
    rows?: number;
}) {
    return (
        <TextAreaField
            label={`${label} (по строке)`}
            value={arrayToLines(value)}
            onChange={(next) => onChange(linesToArray(next))}
            rows={rows}
        />
    );
}

function RichStringListField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
}) {
    return (
        <div className="space-y-2">
            <FieldLabel>{label}</FieldLabel>
            <div className="space-y-2">
                {value.map((str, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <RichTextField
                                label={`Вариант ${index + 1}`}
                                value={str}
                                onChange={(nextStr) => {
                                    const next = [...value];
                                    next[index] = nextStr;
                                    onChange(next);
                                }}
                                minHeight={80}
                            />
                        </div>
                        <Button
                            variant="outlined"
                            className="text-red-600 border-red-100 shrink-0 mt-[26px] h-10"
                            onClick={() => {
                                const next = [...value];
                                next.splice(index, 1);
                                onChange(next);
                            }}
                        >
                            <IoTrashOutline size={14} />
                        </Button>
                    </div>
                ))}
            </div>
            <Button
                variant="outlined"
                onClick={() => onChange([...value, ''])}
            >
                Добавить
            </Button>
        </div>
    );
}

function ShortQuestionsEditor({
    title,
    items,
    onChange,
    addPrefix = 'sq',
    hideAuthorId = false,
    textFirst = false,
    showQuestionTypeToggle = false,
    hideTitle = false,
    baseHref,
    selectedIndex,
}: {
    title: string;
    items: ShortQuestion[];
    onChange: (value: ShortQuestion[]) => void;
    addPrefix?: string;
    hideAuthorId?: boolean;
    textFirst?: boolean;
    showQuestionTypeToggle?: boolean;
    hideTitle?: boolean;
    baseHref?: string;
    selectedIndex?: number;
}) {
    const isDetailPage = Number.isInteger(selectedIndex) && selectedIndex !== undefined;
    const currentItem = isDetailPage ? items[selectedIndex!] : null;

    const updateItem = (index: number, updater: (item: ShortQuestion) => ShortQuestion) => {
        onChange(items.map((item, itemIndex) => (itemIndex === index ? updater(item) : item)));
    };

    if (!isDetailPage) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? (
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base">{title}</h3>
                    </div>
                ) : null}

                <div className="space-y-2">
                    {items.map((item, index) => {
                        const itemHref = baseHref ? buildNestedMaterialsHref(baseHref, String(index)) : '';
                        return (
                            <CompactQuestionRow
                                key={`${item.id}-${index}`}
                                index={index}
                                title={toQuestionPreview(item.text, 'Без формулировки')}
                                meta={buildMetaParts([
                                    `ID: ${item.id || '—'}`,
                                    item.termId ? `Термин: ${item.termId}` : null,
                                    !hideAuthorId && item.authorId ? `Автор: ${item.authorId}` : null,
                                    item.tags ? `Теги: ${item.tags}` : null,
                                    showQuestionTypeToggle ? (item.isTermQuestion ? 'Тип: термин' : 'Тип: произведение') : null,
                                ])}
                                isActive={item.isActive}
                                href={itemHref}
                                ariaLabel={`Открыть запись #${index + 1}`}
                                onDelete={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                            />
                        );
                    })}
                    {!items.length ? <p className="text-sm opacity-60">Пока нет записей.</p> : null}
                </div>

                <div className="pt-2 flex justify-end">
                    <Button variant="outlined" onClick={() => onChange([...items, createShortQuestion(addPrefix)])}>Добавить</Button>
                </div>
            </section>
        );
    }

    if (!currentItem) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? <h3 className="font-bold text-base">{title}</h3> : null}
                <p className="text-sm opacity-70">Запись не найдена.</p>
                {baseHref ? (
                    <Link href={buildNestedMaterialsHref(baseHref)}>
                        <Button variant="outlined">Назад к списку</Button>
                    </Link>
                ) : null}
            </section>
        );
    }

    return (
        <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
            <div className="rounded-lg border border-[#221E20]/10 p-3 space-y-3">
                <div className="flex justify-end">
                    <Button variant="outlined" className="text-red-600 border-red-100" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== selectedIndex))}>
                        <IoTrashOutline size={14} />
                    </Button>
                </div>
                <div className={DETAIL_META_GRID_CLASS}>
                    {textFirst ? (
                        <>
                            <div className={DETAIL_FULL_WIDTH_CLASS}>
                                <RichTextField
                                    label="Текст вопроса"
                                    value={currentItem.text}
                                    onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, text: value }))}
                                    minHeight={140}
                                />
                            </div>
                            <div className={DETAIL_FULL_WIDTH_CLASS}>
                                <TextField
                                    label="Ответ"
                                    value={currentItem.answer || ''}
                                    onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, answer: value }))}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={DETAIL_FULL_WIDTH_CLASS}>
                                <TextField label="Ответ" value={currentItem.answer || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, answer: value }))} />
                            </div>
                            <div className={DETAIL_FULL_WIDTH_CLASS}>
                                <RichTextField
                                    label="Текст вопроса"
                                    value={currentItem.text}
                                    onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, text: value }))}
                                    minHeight={140}
                                />
                            </div>
                        </>
                    )}
                    <TextField compact label="Идентификатор" value={currentItem.id} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, id: value }))} />
                    <StatusField value={currentItem.isActive} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, isActive: value }))} />
                    <TextField compact label="Идентификатор термина" value={currentItem.termId || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, termId: value }))} />
                    {!hideAuthorId ? (
                        <TextField compact label="Идентификатор автора" value={currentItem.authorId || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, authorId: value }))} />
                    ) : null}
                    <TextField compact label="Теги" value={currentItem.tags || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, tags: value }))} />
                </div>

                {showQuestionTypeToggle ? (
                    <Checkbox
                        checked={Boolean(currentItem.isTermQuestion)}
                        onChange={(event) => updateItem(selectedIndex!, (entry) => ({
                            ...entry,
                            isTermQuestion: event.target.checked,
                        }))}
                        label="Вопрос о термине (если выключено — вопрос о произведении)"
                    />
                ) : null}
            </div>

        </section>
    );
}

function TwoGapQuestionsEditor({
    title,
    items,
    onChange,
    addPrefix = 'tg',
    singleEntryMode = false,
    showWithoutAuthor = false,
    hideTitle = false,
    baseHref,
    selectedIndex,
}: {
    title: string;
    items: TwoGapQuestion[];
    onChange: (value: TwoGapQuestion[]) => void;
    addPrefix?: string;
    singleEntryMode?: boolean;
    showWithoutAuthor?: boolean;
    hideTitle?: boolean;
    baseHref?: string;
    selectedIndex?: number;
}) {
    const isDetailPage = Number.isInteger(selectedIndex) && selectedIndex !== undefined;
    const currentItem = isDetailPage ? items[selectedIndex!] : null;

    const sanitizeItem = (item: TwoGapQuestion): TwoGapQuestion => (
        singleEntryMode
            ? { ...item, part2: '', answer2: '', termId2: '' }
            : item
    );

    useEffect(() => {
        if (!singleEntryMode) return;
        const hasSplitFields = items.some((item) => Boolean(item.part2 || item.answer2 || item.termId2));
        if (!hasSplitFields) return;
        onChange(items.map((item) => ({ ...item, part2: '', answer2: '', termId2: '' })));
    }, [items, onChange, singleEntryMode]);

    const updateItem = (index: number, updater: (item: TwoGapQuestion) => TwoGapQuestion) => {
        onChange(items.map((item, itemIndex) => (
            itemIndex === index
                ? sanitizeItem(updater(item))
                : item
        )));
    };

    if (!isDetailPage) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? (
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base">{title}</h3>
                    </div>
                ) : null}

                <div className="space-y-2">
                    {items.map((item, index) => {
                        const itemHref = baseHref ? buildNestedMaterialsHref(baseHref, String(index)) : '';
                        return (
                            <CompactQuestionRow
                                key={`${item.id}-${index}`}
                                index={index}
                                title={toQuestionPreview(item.part1, 'Без формулировки')}
                                meta={buildMetaParts([
                                    `ID: ${item.id || '—'}`,
                                    item.termId1 ? `Термин 1: ${item.termId1}` : null,
                                    !singleEntryMode && item.termId2 ? `Термин 2: ${item.termId2}` : null,
                                    item.tags ? `Теги: ${item.tags}` : null,
                                    showWithoutAuthor && item.withoutAuthor ? 'Без автора' : null,
                                ])}
                                isActive={item.isActive}
                                href={itemHref}
                                ariaLabel={`Открыть запись #${index + 1}`}
                                onDelete={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                            />
                        );
                    })}
                    {!items.length ? <p className="text-sm opacity-60">Пока нет записей.</p> : null}
                </div>

                <div className="pt-2 flex justify-end">
                    <Button variant="outlined" onClick={() => onChange([...items, sanitizeItem(createTwoGapQuestion(addPrefix))])}>Добавить</Button>
                </div>
            </section>
        );
    }

    if (!currentItem) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? <h3 className="font-bold text-base">{title}</h3> : null}
                <p className="text-sm opacity-70">Запись не найдена.</p>
                {baseHref ? (
                    <Link href={buildNestedMaterialsHref(baseHref)}>
                        <Button variant="outlined">Назад к списку</Button>
                    </Link>
                ) : null}
            </section>
        );
    }

    return (
        <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
            <div className="rounded-lg border border-[#221E20]/10 p-3 space-y-3">
                <div className="flex justify-end">
                    <Button variant="outlined" className="text-red-600 border-red-100" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== selectedIndex))}>
                        <IoTrashOutline size={14} />
                    </Button>
                </div>
                <div className={DETAIL_META_GRID_CLASS}>
                    <div className={DETAIL_FULL_WIDTH_CLASS}>
                        <RichTextField
                            label="Текст вопроса"
                            value={currentItem.part1}
                            onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, part1: value }))}
                            minHeight={140}
                        />
                    </div>
                    <div className={DETAIL_FULL_WIDTH_CLASS}>
                        <TextField label="Ответ" value={currentItem.answer1} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, answer1: value }))} />
                    </div>
                    <TextField compact label="Идентификатор" value={currentItem.id} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, id: value }))} />
                    <StatusField value={currentItem.isActive} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, isActive: value }))} />
                    <TextField compact label="Идентификатор термина" value={currentItem.termId1 || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, termId1: value }))} />
                    <TextField compact label="Теги" value={currentItem.tags || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, tags: value }))} />

                    {!singleEntryMode ? (
                        <>
                            <div className={DETAIL_FULL_WIDTH_CLASS}>
                                <RichTextField
                                    label="Текст вопроса (часть 2)"
                                    value={currentItem.part2}
                                    onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, part2: value }))}
                                    minHeight={120}
                                />
                            </div>
                            <div className={DETAIL_FULL_WIDTH_CLASS}>
                                <TextField label="Ответ (часть 2)" value={currentItem.answer2} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, answer2: value }))} />
                            </div>
                            <TextField compact label="Идентификатор термина (часть 2)" value={currentItem.termId2 || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, termId2: value }))} />
                        </>
                    ) : null}
                </div>

                {showWithoutAuthor ? (
                    <Checkbox
                        checked={Boolean(currentItem.withoutAuthor)}
                        onChange={(event) => updateItem(selectedIndex!, (entry) => ({
                            ...entry,
                            withoutAuthor: event.target.checked,
                        }))}
                        label="Без автора (глобальный вопрос)"
                    />
                ) : null}
            </div>

        </section>
    );
}

function EssayQuestionsEditor({
    title,
    items,
    onChange,
    addPrefix = 'essay',
    showAuthorId = true,
    showThemePairIds = true,
    showSimilarityId = true,
    showPublicId = true,
    hideTitle = false,
    baseHref,
    selectedIndex,
}: {
    title: string;
    items: EssayQuestion[];
    onChange: (value: EssayQuestion[]) => void;
    addPrefix?: string;
    showAuthorId?: boolean;
    showThemePairIds?: boolean;
    showSimilarityId?: boolean;
    showPublicId?: boolean;
    hideTitle?: boolean;
    baseHref?: string;
    selectedIndex?: number;
}) {
    const isDetailPage = Number.isInteger(selectedIndex) && selectedIndex !== undefined;
    const currentItem = isDetailPage ? items[selectedIndex!] : null;

    const updateItem = (index: number, updater: (item: EssayQuestion) => EssayQuestion) => {
        onChange(items.map((item, itemIndex) => (itemIndex === index ? updater(item) : item)));
    };

    if (!isDetailPage) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? (
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base">{title}</h3>
                    </div>
                ) : null}
                <div className="space-y-2">
                    {items.map((item, index) => {
                        const itemHref = baseHref ? buildNestedMaterialsHref(baseHref, String(index)) : '';
                        return (
                            <CompactQuestionRow
                                key={`${item.id}-${index}`}
                                index={index}
                                title={toQuestionPreview(item.text, 'Без формулировки')}
                                meta={buildMetaParts([
                                    `ID: ${item.id || '—'}`,
                                    item.termId ? `Термин: ${item.termId}` : null,
                                    showAuthorId && item.authorId ? `Автор: ${item.authorId}` : null,
                                    showThemePairIds && item.theme1Id ? `Тема 1: ${item.theme1Id}` : null,
                                    showThemePairIds && item.theme2Id ? `Тема 2: ${item.theme2Id}` : null,
                                    item.themeInternalId ? `Внутренняя тема: ${item.themeInternalId}` : null,
                                    showSimilarityId && item.similarityId ? `Сопоставление: ${item.similarityId}` : null,
                                    showPublicId && item.publicId ? `Публичный ID: ${item.publicId}` : null,
                                    item.tags ? `Теги: ${item.tags}` : null,
                                ])}
                                isActive={item.isActive}
                                href={itemHref}
                                ariaLabel={`Открыть запись #${index + 1}`}
                                onDelete={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                            />
                        );
                    })}
                    {!items.length ? <p className="text-sm opacity-60">Пока нет записей.</p> : null}
                </div>
                <div className="pt-2 flex justify-end">
                    <Button variant="outlined" onClick={() => onChange([...items, createEssayQuestion(addPrefix)])}>Добавить</Button>
                </div>
            </section>
        );
    }

    if (!currentItem) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? <h3 className="font-bold text-base">{title}</h3> : null}
                <p className="text-sm opacity-70">Запись не найдена.</p>
                {baseHref ? (
                    <Link href={buildNestedMaterialsHref(baseHref)}>
                        <Button variant="outlined">Назад к списку</Button>
                    </Link>
                ) : null}
            </section>
        );
    }

    return (
        <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
            <div className="rounded-lg border border-[#221E20]/10 p-3 space-y-3">
                <div className="flex justify-end">
                    <Button variant="outlined" className="text-red-600 border-red-100" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== selectedIndex))}>
                        <IoTrashOutline size={14} />
                    </Button>
                </div>
                <div className={DETAIL_META_GRID_CLASS}>
                    <TextField compact label="Идентификатор" value={currentItem.id} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, id: value }))} />
                    <StatusField value={currentItem.isActive} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, isActive: value }))} />
                    <TextField compact label="Идентификатор термина" value={currentItem.termId || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, termId: value }))} />
                    {showAuthorId ? (
                        <TextField compact label="Идентификатор автора" value={currentItem.authorId || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, authorId: value }))} />
                    ) : null}
                    {showThemePairIds ? (
                        <TextField compact label="Идентификатор темы 1" value={currentItem.theme1Id || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, theme1Id: value }))} />
                    ) : null}
                    {showThemePairIds ? (
                        <TextField compact label="Идентификатор темы 2" value={currentItem.theme2Id || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, theme2Id: value }))} />
                    ) : null}
                    {showSimilarityId ? (
                        <TextField compact label="Идентификатор типа сопоставления" value={currentItem.similarityId || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, similarityId: value }))} />
                    ) : null}
                    <TextField compact label="Внутр. идентификатор темы" value={currentItem.themeInternalId || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, themeInternalId: value }))} />
                    {showPublicId ? (
                        <TextField compact label="Публичный идентификатор" value={currentItem.publicId || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, publicId: value }))} />
                    ) : null}
                    <TextField compact label="Теги" value={currentItem.tags || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, tags: value }))} />
                    <div className={DETAIL_FULL_WIDTH_CLASS}>
                        <RichTextField
                            label="Текст вопроса"
                            value={currentItem.text}
                            onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, text: value }))}
                            minHeight={180}
                        />
                    </div>
                </div>
            </div>

        </section>
    );
}

function MatchingQuestionsEditor({
    title,
    items,
    onChange,
    addPrefix = 'mq',
    hideAuthorId = false,
    hideTitle = false,
    baseHref,
    selectedIndex,
}: {
    title: string;
    items: MatchingQuestion[];
    onChange: (value: MatchingQuestion[]) => void;
    addPrefix?: string;
    hideAuthorId?: boolean;
    hideTitle?: boolean;
    baseHref?: string;
    selectedIndex?: number;
}) {
    const isDetailPage = Number.isInteger(selectedIndex) && selectedIndex !== undefined;
    const currentItem = isDetailPage ? items[selectedIndex!] : null;

    const updateItem = (index: number, updater: (item: MatchingQuestion) => MatchingQuestion) => {
        onChange(items.map((item, itemIndex) => (itemIndex === index ? updater(item) : item)));
    };
    const getCurrentPropertyCategory = (item: MatchingQuestion): MatchingQuestion['pairPropertyType'] => (
        item.pairPropertyType || 'phrases'
    );
    const getPairPropertyValues = (
        pair: MatchPair,
        category: MatchingQuestion['pairPropertyType'],
    ): string[] => {
        if (category === 'characteristics') {
            return pair.characteristics?.length ? pair.characteristics : pair.properties;
        }

        return pair.phrases?.length ? pair.phrases : pair.properties;
    };
    const setPairPropertyValues = (
        pair: MatchPair,
        category: MatchingQuestion['pairPropertyType'],
        values: string[],
    ): MatchPair => {
        const normalized = values.map((value) => value.trim());
        const ids = pair.propertyIds ? [...pair.propertyIds] : [];
        while (ids.length < normalized.length) ids.push('');
        const trimmedIds = ids.slice(0, normalized.length);
        if (category === 'characteristics') {
            return {
                ...pair,
                properties: normalized.filter(Boolean),
                propertyIds: trimmedIds,
                phrases: [],
                characteristics: normalized,
            };
        }

        return {
            ...pair,
            properties: normalized.filter(Boolean),
            propertyIds: trimmedIds,
            phrases: normalized,
            characteristics: [],
        };
    };
    const setPairPropertyId = (pair: MatchPair, propertyIndex: number, newId: string): MatchPair => {
        const ids = pair.propertyIds ? [...pair.propertyIds] : [];
        while (ids.length <= propertyIndex) ids.push('');
        ids[propertyIndex] = newId;
        return { ...pair, propertyIds: ids };
    };

    if (!isDetailPage) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? (
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base">{title}</h3>
                    </div>
                ) : null}

                <div className="space-y-2">
                    {items.map((item, index) => {
                        const itemHref = baseHref ? buildNestedMaterialsHref(baseHref, String(index)) : '';
                        return (
                            <CompactQuestionRow
                                key={`${item.id}-${index}`}
                                index={index}
                                title={toQuestionPreview(item.prompt, 'Без формулировки')}
                                meta={buildMetaParts([
                                    `ID: ${item.id || '—'}`,
                                    item.termId ? `Термин: ${item.termId}` : null,
                                    !hideAuthorId && item.authorId ? `Автор: ${item.authorId}` : null,
                                    item.tags ? `Теги: ${item.tags}` : null,
                                    item.characterCount ? `Персонажей: ${item.characterCount}` : null,
                                    `Пар: ${item.pairs.length}`,
                                ])}
                                isActive={item.isActive}
                                href={itemHref}
                                ariaLabel={`Открыть запись #${index + 1}`}
                                onDelete={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                            />
                        );
                    })}
                    {!items.length ? <p className="text-sm opacity-60">Пока нет записей.</p> : null}
                </div>

                <div className="pt-2 flex justify-end">
                    <Button variant="outlined" onClick={() => onChange([...items, createMatchingQuestion(addPrefix)])}>Добавить</Button>
                </div>
            </section>
        );
    }

    if (!currentItem) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? <h3 className="font-bold text-base">{title}</h3> : null}
                <p className="text-sm opacity-70">Запись не найдена.</p>
                {baseHref ? (
                    <Link href={buildNestedMaterialsHref(baseHref)}>
                        <Button variant="outlined">Назад к списку</Button>
                    </Link>
                ) : null}
            </section>
        );
    }

    return (
        <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
            <div className="rounded-lg border border-[#221E20]/10 p-3 space-y-3">
                <div className="flex justify-end">
                    <Button variant="outlined" className="text-red-600 border-red-100" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== selectedIndex))}>
                        <IoTrashOutline size={14} />
                    </Button>
                </div>

                <div className={DETAIL_META_GRID_CLASS}>
                    <TextField compact label="Идентификатор" value={currentItem.id} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, id: value }))} />
                    <StatusField value={currentItem.isActive} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, isActive: value }))} />
                    <TextField compact label="Идентификатор термина" value={currentItem.termId || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, termId: value }))} />
                    <TextField compact label="Теги" value={currentItem.tags || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, tags: value }))} />
                    {!hideAuthorId ? (
                        <TextField compact label="Идентификатор автора" value={currentItem.authorId || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, authorId: value }))} />
                    ) : null}
                    <TextField label="Левая колонка" value={currentItem.leftLabel} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, leftLabel: value }))} />
                    <TextField label="Правая колонка" value={currentItem.rightLabel} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, rightLabel: value }))} />
                    <TextField
                        compact
                        label="Количество персонажей"
                        value={currentItem.characterCount?.toString() || ''}
                        onChange={(value) => updateItem(selectedIndex!, (entry) => {
                            const parsed = Number(value);
                            return {
                                ...entry,
                                characterCount: value.trim() && Number.isFinite(parsed) ? parsed : undefined,
                            };
                        })}
                    />
                    <label className="flex flex-col gap-1">
                        <FieldLabel>Категория свойств</FieldLabel>
                        <select
                            value={currentItem.pairPropertyType || 'phrases'}
                            onChange={(event) => updateItem(selectedIndex!, (entry) => {
                                const nextCategory = event.target.value as MatchingQuestion['pairPropertyType'];
                                return {
                                    ...entry,
                                    pairPropertyType: nextCategory,
                                    pairs: entry.pairs.map((pair) => (
                                        setPairPropertyValues(pair, nextCategory, getPairPropertyValues(pair, nextCategory))
                                    )),
                                };
                            })}
                            className="h-[40px] rounded-lg border border-[#221E20]/15 bg-white px-3 text-sm outline-none focus:border-[#221E20]"
                        >
                            <option value="phrases">Фразы</option>
                            <option value="characteristics">Характеристики</option>
                        </select>
                    </label>
                    <div className={DETAIL_FULL_WIDTH_CLASS}>
                        <RichTextField
                            label="Формулировка"
                            value={currentItem.prompt}
                            onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, prompt: value }))}
                            minHeight={160}
                        />
                    </div>
                </div>

                <div className="rounded-lg border border-[#221E20]/10 p-3 space-y-3">
                    <p className="text-sm font-bold">Пары</p>

                    {currentItem.pairs.map((pair) => (
                        <div key={pair.id} className="rounded-lg border border-[#221E20]/10 p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold opacity-70">{pair.id}</p>
                                <Button
                                    variant="outlined"
                                    className="text-red-600 border-red-100"
                                    onClick={() => updateItem(selectedIndex!, (entry) => ({ ...entry, pairs: entry.pairs.filter((p) => p.id !== pair.id) }))}
                                >
                                    <IoTrashOutline size={14} />
                                </Button>
                            </div>
                            <div className={DETAIL_META_GRID_CLASS}>
                                <TextField
                                    compact
                                    label="Идентификатор"
                                    value={pair.id}
                                    onChange={(value) => updateItem(selectedIndex!, (entry) => ({
                                        ...entry,
                                        pairs: entry.pairs.map((p) => (p.id === pair.id ? { ...p, id: value } : p)),
                                    }))}
                                />
                                <TextField
                                    label="Персонаж"
                                    value={pair.character}
                                    onChange={(value) => updateItem(selectedIndex!, (entry) => ({
                                        ...entry,
                                        pairs: entry.pairs.map((p) => (p.id === pair.id ? { ...p, character: value } : p)),
                                    }))}
                                />
                                <TextField
                                    label="Тег"
                                    value={pair.tag || ''}
                                    onChange={(value) => updateItem(selectedIndex!, (entry) => ({
                                        ...entry,
                                        pairs: entry.pairs.map((p) => (p.id === pair.id ? { ...p, tag: value } : p)),
                                    }))}
                                />
                                <div className={DETAIL_FULL_WIDTH_CLASS}>
                                    <RichStringListField
                                        label={getCurrentPropertyCategory(currentItem) === 'characteristics' ? 'Характеристики' : 'Фразы'}
                                        value={getPairPropertyValues(pair, getCurrentPropertyCategory(currentItem))}
                                        onChange={(value) => updateItem(selectedIndex!, (entry) => ({
                                            ...entry,
                                            pairs: entry.pairs.map((p) => (
                                                p.id === pair.id
                                                    ? setPairPropertyValues(p, getCurrentPropertyCategory(entry), value)
                                                    : p
                                            )),
                                        }))}
                                    />
                                    {getPairPropertyValues(pair, getCurrentPropertyCategory(currentItem)).length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            <FieldLabel>Идентификаторы свойств (для исключения)</FieldLabel>
                                            <div className="space-y-1">
                                                {getPairPropertyValues(pair, getCurrentPropertyCategory(currentItem)).map((_, propIdx) => (
                                                    <div key={propIdx} className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-400 w-20 shrink-0">Вариант {propIdx + 1}:</span>
                                                        <input
                                                            type="text"
                                                            className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                                                            placeholder={`${pair.id}:${propIdx}`}
                                                            value={(pair.propertyIds || [])[propIdx] || ''}
                                                            onChange={(e) => updateItem(selectedIndex!, (entry) => ({
                                                                ...entry,
                                                                pairs: entry.pairs.map((p) => (
                                                                    p.id === pair.id
                                                                        ? setPairPropertyId(p, propIdx, e.target.value)
                                                                        : p
                                                                )),
                                                            }))}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="pt-2 flex justify-end">
                        <Button variant="outlined" onClick={() => updateItem(selectedIndex!, (entry) => ({ ...entry, pairs: [...entry.pairs, createMatchPair()] }))}>
                            Добавить пару
                        </Button>
                    </div>
                </div>
            </div>

        </section>
    );
}

function CharactersEditor({
    items,
    onChange,
    hideTitle = false,
    baseHref,
    selectedIndex,
}: {
    items: Character[];
    onChange: (value: Character[]) => void;
    hideTitle?: boolean;
    baseHref?: string;
    selectedIndex?: number;
}) {
    const isDetailPage = Number.isInteger(selectedIndex) && selectedIndex !== undefined;
    const currentItem = isDetailPage ? items[selectedIndex!] : null;

    const updateItem = (index: number, updater: (item: Character) => Character) => {
        onChange(items.map((item, itemIndex) => (itemIndex === index ? updater(item) : item)));
    };

    if (!isDetailPage) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? (
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base">Банк персонажей</h3>
                    </div>
                ) : null}

                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div
                            key={`${item.id}-${index}`}
                            className={`relative rounded-lg border border-[#221E20]/10 px-3 py-2 flex items-center justify-between gap-3 ${baseHref ? 'hover:border-[#221E20]/30 hover:bg-black/[0.02] transition-colors' : ''}`}
                        >
                            {baseHref ? <Link href={buildNestedMaterialsHref(baseHref, String(index))} className="absolute inset-0 z-10 rounded-lg" aria-label={`Открыть запись #${index + 1}`} /> : null}
                            <div className="relative z-20 min-w-0 pointer-events-none">
                                <p className="text-xs font-bold opacity-70">#{index + 1}</p>
                                <p className="text-sm truncate">{item.name || item.id || 'Без имени'}</p>
                            </div>
                            <div className="relative z-30 flex items-center gap-2 shrink-0">
                                <Button variant="outlined" className="text-red-600 border-red-100" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
                                    <IoTrashOutline size={14} />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {!items.length ? <p className="text-sm opacity-60">Пока нет записей.</p> : null}
                </div>

                <div className="pt-2 flex justify-end">
                    <Button variant="outlined" onClick={() => onChange([...items, createCharacter()])}>Добавить персонажа</Button>
                </div>
            </section>
        );
    }

    if (!currentItem) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? <h3 className="font-bold text-base">Банк персонажей</h3> : null}
                <p className="text-sm opacity-70">Запись не найдена.</p>
                {baseHref ? (
                    <Link href={buildNestedMaterialsHref(baseHref)}>
                        <Button variant="outlined">Назад к списку</Button>
                    </Link>
                ) : null}
            </section>
        );
    }

    return (
        <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
            <div className="rounded-lg border border-[#221E20]/10 p-3 space-y-3">
                <div className="flex justify-end">
                    <Button variant="outlined" className="text-red-600 border-red-100" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== selectedIndex))}>
                        <IoTrashOutline size={14} />
                    </Button>
                </div>
                <div className={DETAIL_META_GRID_CLASS}>
                    <TextField compact label="Идентификатор" value={currentItem.id} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, id: value }))} />
                    <TextField label="Имя персонажа" value={currentItem.name} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, name: value }))} />
                    <TextField compact label="Тег" value={currentItem.tag || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, tag: value }))} />
                    <div className={DETAIL_FULL_WIDTH_CLASS}>
                        <StringListField label="Цитаты" value={currentItem.quotes} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, quotes: value }))} />
                    </div>
                    <div className={DETAIL_FULL_WIDTH_CLASS}>
                        <StringListField label="Факты" value={currentItem.facts} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, facts: value }))} />
                    </div>
                </div>
            </div>

            <div className="pt-2 flex justify-end">
                <Button variant="outlined" onClick={() => onChange([...items, createCharacter()])}>Добавить персонажа</Button>
            </div>
        </section>
    );
}

function MultiSelectQuestionsEditor({
    title,
    items,
    onChange,
    hideTitle = false,
    baseHref,
    selectedIndex,
}: {
    title: string;
    items: MultiSelectQuestion[];
    onChange: (value: MultiSelectQuestion[]) => void;
    hideTitle?: boolean;
    baseHref?: string;
    selectedIndex?: number;
}) {
    const isDetailPage = Number.isInteger(selectedIndex) && selectedIndex !== undefined;
    const currentItem = isDetailPage ? items[selectedIndex!] : null;

    const updateItem = (index: number, updater: (item: MultiSelectQuestion) => MultiSelectQuestion) => {
        onChange(items.map((item, itemIndex) => (itemIndex === index ? updater(item) : item)));
    };

    if (!isDetailPage) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? (
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base">{title}</h3>
                    </div>
                ) : null}

                <div className="space-y-2">
                    {items.map((item, index) => {
                        const itemHref = baseHref ? buildNestedMaterialsHref(baseHref, String(index)) : '';
                        return (
                            <CompactQuestionRow
                                key={`${item.id}-${index}`}
                                index={index}
                                title={toQuestionPreview(item.prompt, 'Без формулировки')}
                                meta={buildMetaParts([
                                    `ID: ${item.id || '—'}`,
                                    item.termId ? `Термин: ${item.termId}` : null,
                                    item.tags ? `Теги: ${item.tags}` : null,
                                    item.options.length ? `Вариантов: ${item.options.length}` : null,
                                    item.options.some((option) => option.isCorrect) ? `Верных: ${item.options.filter((option) => option.isCorrect).length}` : 'Верных: 0',
                                ])}
                                isActive={item.isActive}
                                href={itemHref}
                                ariaLabel={`Открыть запись #${index + 1}`}
                                onDelete={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                            />
                        );
                    })}
                    {!items.length ? <p className="text-sm opacity-60">Пока нет записей.</p> : null}
                </div>

                <div className="pt-2 flex justify-end">
                    <Button variant="outlined" onClick={() => onChange([...items, createMultiSelectQuestion()])}>Добавить</Button>
                </div>
            </section>
        );
    }

    if (!currentItem) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                {!hideTitle ? <h3 className="font-bold text-base">{title}</h3> : null}
                <p className="text-sm opacity-70">Запись не найдена.</p>
                {baseHref ? (
                    <Link href={buildNestedMaterialsHref(baseHref)}>
                        <Button variant="outlined">Назад к списку</Button>
                    </Link>
                ) : null}
            </section>
        );
    }

    return (
        <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
            <div className="rounded-lg border border-[#221E20]/10 p-3 space-y-3">
                <div className="flex justify-end">
                    <Button variant="outlined" className="text-red-600 border-red-100" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== selectedIndex))}>
                        <IoTrashOutline size={14} />
                    </Button>
                </div>
                <div className={DETAIL_META_GRID_CLASS}>
                    <TextField compact label="Идентификатор" value={currentItem.id} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, id: value }))} />
                    <StatusField value={currentItem.isActive} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, isActive: value }))} />
                    <TextField compact label="Идентификатор термина" value={currentItem.termId || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, termId: value }))} />
                    <TextField compact label="Теги" value={currentItem.tags || ''} onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, tags: value }))} />
                    <div className={DETAIL_FULL_WIDTH_CLASS}>
                        <RichTextField
                            label="Формулировка"
                            value={currentItem.prompt}
                            onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, prompt: value }))}
                            minHeight={160}
                        />
                    </div>
                </div>

                <div className="rounded-lg border border-[#221E20]/10 p-3 space-y-3">
                    <p className="text-sm font-bold">Варианты</p>
                    {currentItem.options.map((option) => (
                        <div key={option.id} className="rounded-lg border border-[#221E20]/10 p-2 flex items-center gap-3 bg-white">
                            <Checkbox
                                label="Верно"
                                checked={!!option.isCorrect}
                                onChange={(e) => updateItem(selectedIndex!, (entry) => ({
                                    ...entry,
                                    options: entry.options.map((opt) => (opt.id === option.id ? { ...opt, isCorrect: e.target.checked } : opt)),
                                }))}
                            />
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2">
                                <TextField
                                    compact
                                    label="Идентификатор"
                                    value={option.id}
                                    onChange={(value) => updateItem(selectedIndex!, (entry) => ({
                                        ...entry,
                                        options: entry.options.map((opt) => (opt.id === option.id ? { ...opt, id: value } : opt)),
                                    }))}
                                />
                                <TextField
                                    compact
                                    label="Термин"
                                    value={option.term}
                                    onChange={(value) => updateItem(selectedIndex!, (entry) => ({
                                        ...entry,
                                        options: entry.options.map((opt) => (opt.id === option.id ? { ...opt, term: value } : opt)),
                                    }))}
                                />
                                <TextField
                                    compact
                                    label="ИД термина (опц.)"
                                    value={option.termId || ''}
                                    onChange={(value) => updateItem(selectedIndex!, (entry) => ({
                                        ...entry,
                                        options: entry.options.map((opt) => (opt.id === option.id ? { ...opt, termId: value } : opt)),
                                    }))}
                                />
                            </div>
                            <Button
                                variant="outlined"
                                className="text-red-600 border-red-100 shrink-0 h-full max-h-[38px] mt-[18px]"
                                onClick={() => updateItem(selectedIndex!, (entry) => ({ ...entry, options: entry.options.filter((opt) => opt.id !== option.id) }))}
                            >
                                <IoTrashOutline size={14} />
                            </Button>
                        </div>
                    ))}

                    <div className="pt-2 flex justify-end">
                        <Button variant="outlined" onClick={() => updateItem(selectedIndex!, (entry) => ({ ...entry, options: [...entry.options, createMultiSelectOption()] }))}>
                            Добавить вариант
                        </Button>
                    </div>
                </div>
            </div>

        </section>
    );
}

function CommonTasksEditor({
    value,
    onChange,
    baseHref,
    taskKey,
    selectedIndex,
}: {
    value: Work['commonTasks'];
    onChange: (value: Work['commonTasks']) => void;
    baseHref: string;
    taskKey?: CommonTaskKey;
    selectedIndex?: number;
}) {
    if (!taskKey) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-4">
                <h3 className="font-bold text-base">Выберите задание</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {COMMON_TASK_KEYS.map((key) => (
                        <Link
                            key={key}
                            href={buildNestedMaterialsHref(baseHref, key)}
                            className="rounded-lg border border-[#221E20]/10 px-3 py-2 hover:border-[#221E20]/30 transition-colors"
                        >
                            <p className="font-bold text-sm">{COMMON_TASK_LABELS[key]}</p>
                            <p className="text-xs opacity-60 mt-1">Активно: {countActiveItems(value[key])} / {value[key].length}</p>
                        </Link>
                    ))}
                </div>
            </section>
        );
    }

    if (taskKey === 'task1') {
        return (
            <ShortQuestionsEditor
                title="Общие вопросы: задание 1"
                items={value.task1}
                addPrefix="task1"
                hideAuthorId
                textFirst
                showQuestionTypeToggle
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, taskKey)}
                selectedIndex={selectedIndex}
                onChange={(task1) => onChange({ ...value, task1 })}
            />
        );
    }

    if (taskKey === 'task2') {
        return (
            <MatchingQuestionsEditor
                title="Общие вопросы: задание 2"
                items={value.task2}
                addPrefix="task2"
                hideAuthorId
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, taskKey)}
                selectedIndex={selectedIndex}
                onChange={(task2) => onChange({ ...value, task2 })}
            />
        );
    }

    return (
        <TwoGapQuestionsEditor
            title="Общие вопросы: задание 3"
            items={value.task3}
            addPrefix="task3"
            singleEntryMode
            showWithoutAuthor
            hideTitle
            baseHref={buildNestedMaterialsHref(baseHref, taskKey)}
            selectedIndex={selectedIndex}
            onChange={(task3) => onChange({ ...value, task3 })}
        />
    );
}

function ExcerptTasksEditor({
    value,
    onChange,
    baseHref,
    taskKey,
    selectedIndex,
}: {
    value: ExcerptTasks;
    onChange: (value: ExcerptTasks) => void;
    baseHref: string;
    taskKey?: ExcerptTaskKey;
    selectedIndex?: number;
}) {
    if (!taskKey) {
        return (
            <div className="space-y-4">
                <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-4">
                    <h3 className="font-bold text-base">Выберите задание</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {EXCERPT_TASK_KEYS.map((key) => (
                            <Link
                                key={key}
                                href={buildNestedMaterialsHref(baseHref, 'tasks', key)}
                                className="rounded-lg border border-[#221E20]/10 px-3 py-2 hover:border-[#221E20]/30 transition-colors"
                            >
                                <p className="font-bold text-sm">{EXCERPT_TASK_LABELS[key]}</p>
                                <p className="text-xs opacity-60 mt-1">Активно: {countActiveItems(value[key])} / {value[key].length}</p>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="rounded-xl border border-[#221E20]/10 bg-white p-4">
                    <h3 className="font-bold text-base mb-3">Исключения из общих заданий</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        <StringListField
                            label="Исключить идентификаторы из задания 1"
                            value={value.excludeTask1Ids}
                            onChange={(excludeTask1Ids) => onChange({ ...value, excludeTask1Ids })}
                        />
                        <StringListField
                            label="Исключить termId из задания 1"
                            value={value.excludeTask1TermIds || []}
                            onChange={(excludeTask1TermIds) => onChange({ ...value, excludeTask1TermIds })}
                        />
                        <StringListField
                            label="Исключить идентификаторы из задания 2"
                            value={value.excludeTask2Ids}
                            onChange={(excludeTask2Ids) => onChange({ ...value, excludeTask2Ids })}
                        />
                        <StringListField
                            label="Исключить termId из задания 2"
                            value={value.excludeTask2TermIds || []}
                            onChange={(excludeTask2TermIds) => onChange({ ...value, excludeTask2TermIds })}
                        />
                        <StringListField
                            label="Исключить героев из задания 2"
                            value={value.excludeTask2Characters || []}
                            onChange={(excludeTask2Characters) => onChange({ ...value, excludeTask2Characters })}
                        />
                        <StringListField
                            label="Исключить свойства из задания 2"
                            value={value.excludeTask2Properties || []}
                            onChange={(excludeTask2Properties) => onChange({ ...value, excludeTask2Properties })}
                        />
                        <StringListField
                            label="Исключить идентификаторы из задания 3"
                            value={value.excludeTask3Ids}
                            onChange={(excludeTask3Ids) => onChange({ ...value, excludeTask3Ids })}
                        />
                        <StringListField
                            label="Исключить termId из задания 3"
                            value={value.excludeTask3TermIds || []}
                            onChange={(excludeTask3TermIds) => onChange({ ...value, excludeTask3TermIds })}
                        />
                    </div>
                </section>
            </div>
        );
    }

    if (taskKey === 'customTask1') {
        return (
            <ShortQuestionsEditor
                title="Кастомные вопросы задания 1"
                items={value.customTask1}
                addPrefix="ex-t1"
                showQuestionTypeToggle
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
                selectedIndex={selectedIndex}
                onChange={(customTask1) => onChange({ ...value, customTask1 })}
            />
        );
    }

    if (taskKey === 'customTask2') {
        return (
            <MatchingQuestionsEditor
                title="Кастомные вопросы задания 2"
                items={value.customTask2}
                addPrefix="ex-t2"
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
                selectedIndex={selectedIndex}
                onChange={(customTask2) => onChange({ ...value, customTask2 })}
            />
        );
    }

    if (taskKey === 'customTask3') {
        return (
            <TwoGapQuestionsEditor
                title="Кастомные вопросы задания 3"
                items={value.customTask3}
                addPrefix="ex-t3"
                singleEntryMode
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
                selectedIndex={selectedIndex}
                onChange={(customTask3) => onChange({ ...value, customTask3 })}
            />
        );
    }

    if (taskKey === 'task4_1') {
        return (
            <EssayQuestionsEditor
                title="Задание 4.1"
                items={value.task4_1}
                addPrefix="ex-t4-1"
                showAuthorId={false}
                showThemePairIds={false}
                showSimilarityId={false}
                showPublicId={false}
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
                selectedIndex={selectedIndex}
                onChange={(task4_1) => onChange({ ...value, task4_1 })}
            />
        );
    }

    if (taskKey === 'task4_2') {
        return (
            <EssayQuestionsEditor
                title="Задание 4.2"
                items={value.task4_2}
                addPrefix="ex-t4-2"
                showAuthorId={false}
                showThemePairIds={false}
                showSimilarityId={false}
                showPublicId={false}
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
                selectedIndex={selectedIndex}
                onChange={(task4_2) => onChange({ ...value, task4_2 })}
            />
        );
    }

    return (
        <EssayQuestionsEditor
            title="Задание 5"
            items={value.task5}
            addPrefix="ex-t5"
            showThemePairIds={false}
            showSimilarityId={false}
            hideTitle
            baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
            selectedIndex={selectedIndex}
            onChange={(task5) => onChange({ ...value, task5 })}
        />
    );
}

function PoemTasksEditor({
    value,
    onChange,
    baseHref,
    taskKey,
    selectedIndex,
}: {
    value: PoemTasks;
    onChange: (value: PoemTasks) => void;
    baseHref: string;
    taskKey?: PoemTaskKey;
    selectedIndex?: number;
}) {
    if (!taskKey) {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-4">
                <h3 className="font-bold text-base">Выберите задание</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {POEM_TASK_KEYS.map((key) => (
                        <Link
                            key={key}
                            href={buildNestedMaterialsHref(baseHref, 'tasks', key)}
                            className="rounded-lg border border-[#221E20]/10 px-3 py-2 hover:border-[#221E20]/30 transition-colors"
                        >
                            <p className="font-bold text-sm">{POEM_TASK_LABELS[key]}</p>
                            <p className="text-xs opacity-60 mt-1">Активно: {countActiveItems(value[key])} / {value[key].length}</p>
                        </Link>
                    ))}
                </div>
            </section>
        );
    }

    if (taskKey === 'task6') {
        return (
            <TwoGapQuestionsEditor
                title="Задание 6"
                items={value.task6}
                addPrefix="poem-t6"
                singleEntryMode
                showWithoutAuthor
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
                selectedIndex={selectedIndex}
                onChange={(task6) => onChange({ ...value, task6 })}
            />
        );
    }

    if (taskKey === 'task7') {
        return (
            <ShortQuestionsEditor
                title="Задание 7"
                items={value.task7}
                addPrefix="poem-t7"
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
                selectedIndex={selectedIndex}
                onChange={(task7) => onChange({ ...value, task7 })}
            />
        );
    }

    if (taskKey === 'task8') {
        return (
            <MultiSelectQuestionsEditor
                title="Задание 8"
                items={value.task8}
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
                selectedIndex={selectedIndex}
                onChange={(task8) => onChange({ ...value, task8 })}
            />
        );
    }

    if (taskKey === 'task9_1') {
        return (
            <EssayQuestionsEditor
                title="Задание 9.1"
                items={value.task9_1}
                addPrefix="poem-t9-1"
                showAuthorId={false}
                showThemePairIds={false}
                showSimilarityId={false}
                showPublicId={false}
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
                selectedIndex={selectedIndex}
                onChange={(task9_1) => onChange({ ...value, task9_1 })}
            />
        );
    }

    if (taskKey === 'task9_2') {
        return (
            <EssayQuestionsEditor
                title="Задание 9.2"
                items={value.task9_2}
                addPrefix="poem-t9-2"
                showAuthorId={false}
                showThemePairIds={false}
                showSimilarityId={false}
                showPublicId={false}
                hideTitle
                baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
                selectedIndex={selectedIndex}
                onChange={(task9_2) => onChange({ ...value, task9_2 })}
            />
        );
    }

    return (
        <EssayQuestionsEditor
            title="Задание 10"
            items={value.task10}
            addPrefix="poem-t10"
            hideTitle
            baseHref={buildNestedMaterialsHref(baseHref, 'tasks', taskKey)}
            selectedIndex={selectedIndex}
            onChange={(task10) => onChange({ ...value, task10 })}
        />
    );
}

function BreadcrumbsNav({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav className="flex flex-wrap items-center gap-2 text-sm mb-6">
            {items.map((item, index) => {
                const hasMenu = Boolean((item.siblings && item.siblings.length) || item.onAdd);
                return (
                    <React.Fragment key={`${item.href}-${item.label}-${index}`}>
                        {index > 0 ? <span className="opacity-40">/</span> : null}
                        <div className="relative group flex items-center h-full">
                            <Link href={item.href} className="rounded px-2 py-1 hover:bg-black/5 transition-colors">
                                {item.label}
                            </Link>

                            {hasMenu || item.onAdd ? (
                                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute left-0 top-[120%] z-30 mt-1 min-w-[260px] rounded-lg border border-[#221E20]/10 bg-white shadow-lg transition-all">
                                    <div className="max-h-[280px] overflow-auto py-1">
                                        {item.onAdd ? (
                                            <>
                                                <button
                                                    className="w-full text-left px-3 py-2 text-sm text-[#0b63f6] font-bold hover:bg-black/5"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        item.onAdd?.();
                                                    }}
                                                >
                                                    + {item.addLabel || 'Добавить'}
                                                </button>
                                                {hasMenu && <div className="h-px bg-black/5 my-1 mx-2" />}
                                            </>
                                        ) : null}

                                        {item.siblings?.map((sibling) => (
                                            <Link
                                                key={sibling.href}
                                                href={sibling.href}
                                                className="block px-3 py-2 text-sm hover:bg-black/5"
                                            >
                                                {sibling.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </React.Fragment>
                );
            })}
        </nav>
    );
}

function NotFoundPane({ title, onBack }: { title: string; onBack: () => void }) {
    return (
        <div className="rounded-xl border border-[#221E20]/10 bg-white p-8 space-y-4">
            <h2 className="text-2xl font-bold">{title}</h2>
            <Button variant="outlined" onClick={onBack}>Назад</Button>
        </div>
    );
}

export default function AdminMaterialsPages() {
    const router = useRouter();
    const params = useParams<{ slug?: string[] }>();
    const missingEntityReloads = useRef<Record<string, true>>({});

    const slug = useMemo(() => {
        const raw = params?.slug;
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
        return list.map(decodeSegment);
    }, [params]);

    const section = slug[0] as SectionKey | undefined;

    const [works, setWorks] = useState<Work[]>([]);
    const [poets, setPoets] = useState<Poet[]>([]);
    const [block3, setBlock3] = useState<Block3Data>({
        task11_1: [],
        task11_2_3: [],
        task11_4: [],
        task11_5: [],
    });
    const [settings, setSettings] = useState<KnowledgeBaseSettings>(DEFAULT_KNOWLEDGE_BASE_SETTINGS);

    const [isLoading, setIsLoading] = useState(true);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState('');

    const loadKnowledgeBase = useCallback(async () => {
        setStatus('');
        setIsLoading(true);
        try {
            const data = await fetchKnowledgeBase();
            setWorks(data.works);
            setPoets(data.poets);
            setBlock3(data.block3);
            setSettings(data.settings);
            setInitialLoaded(true);
        } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Не удалось загрузить базу знаний');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveVersionRef = useRef(0);

    const persistKnowledgeBase = useCallback(async (
        nextState: { works: Work[]; poets: Poet[]; block3: Block3Data; settings?: KnowledgeBaseSettings },
        successMessage?: string,
    ) => {
        const version = ++saveVersionRef.current;
        setStatus('');
        setIsSaving(true);
        try {
            const data = await updateKnowledgeBase({
                ...nextState,
                settings: nextState.settings ?? settings,
            });
            if (saveVersionRef.current === version) {
                setWorks(data.works);
                setPoets(data.poets);
                setBlock3(data.block3);
                setSettings(data.settings);
            }
            if (successMessage) {
                setStatus(successMessage);
            }
            return true;
        } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Не удалось сохранить изменения');
            return false;
        } finally {
            if (saveVersionRef.current === version) {
                setIsSaving(false);
            }
        }
    }, [settings]);



    useEffect(() => {
        void loadKnowledgeBase();
    }, [loadKnowledgeBase]);

    const saveKnowledgeBase = useCallback(async () => {
        await persistKnowledgeBase({ works, poets, block3, settings }, 'Изменения сохранены в БД');
    }, [block3, poets, settings, works, persistKnowledgeBase]);

    const replaceWork = useCallback((workId: Id, updater: (work: Work) => Work) => {
        setWorks((prev) => prev.map((work) => (work.id === workId ? updater(work) : work)));
    }, []);

    const replacePoet = useCallback((poetId: Id, updater: (poet: Poet) => Poet) => {
        setPoets((prev) => prev.map((poet) => (poet.id === poetId ? updater(poet) : poet)));
    }, []);

    const workId = section === 'works' ? slug[1] : undefined;
    const rawWorkSubSection = section === 'works' ? slug[2] : undefined;
    const workSubSection: WorkSubSectionKey | undefined = (
        rawWorkSubSection === 'excerpts'
        || rawWorkSubSection === 'common-questions'
        || rawWorkSubSection === 'characters'
    ) ? rawWorkSubSection : undefined;
    const excerptId = section === 'works' && workSubSection === 'excerpts' ? slug[3] : undefined;

    const poetId = section === 'poets' ? slug[1] : undefined;
    const rawPoetSubSection = section === 'poets' ? slug[2] : undefined;
    const poetSubSection: PoetSubSectionKey | undefined = rawPoetSubSection === 'poems' ? 'poems' : undefined;
    const poemId = section === 'poets' && poetSubSection === 'poems' ? slug[3] : undefined;

    const block3Key = section === 'block3' ? (slug[1] as Block3Key | undefined) : undefined;
    const commonTaskSegment = section === 'works' && workSubSection === 'common-questions' ? slug[3] : undefined;
    const commonTaskKey = isCommonTaskKey(commonTaskSegment) ? commonTaskSegment : undefined;
    const commonQuestionIndex = section === 'works' && workSubSection === 'common-questions' && commonTaskKey
        ? parseIndexSegment(slug[4])
        : undefined;
    const charactersQuestionIndex = section === 'works' && workSubSection === 'characters'
        ? parseIndexSegment(slug[3])
        : undefined;

    const excerptNestedScope = section === 'works' && workSubSection === 'excerpts' ? slug[4] : undefined;
    const excerptTaskSegment = excerptNestedScope === 'tasks' ? slug[5] : undefined;
    const excerptTaskKey = isExcerptTaskKey(excerptTaskSegment) ? excerptTaskSegment : undefined;
    const excerptQuestionIndex = section === 'works' && workSubSection === 'excerpts' && excerptTaskKey
        ? parseIndexSegment(slug[6])
        : undefined;

    const poemNestedScope = section === 'poets' && poetSubSection === 'poems' ? slug[4] : undefined;
    const poemTaskSegment = poemNestedScope === 'tasks' ? slug[5] : undefined;
    const poemTaskKey = isPoemTaskKey(poemTaskSegment) ? poemTaskSegment : undefined;
    const poemQuestionIndex = section === 'poets' && poetSubSection === 'poems' && poemTaskKey
        ? parseIndexSegment(slug[6])
        : undefined;
    const block3QuestionIndex = section === 'block3' ? parseIndexSegment(slug[2]) : undefined;

    const currentWork = useMemo(
        () => (workId ? works.find((work) => work.id === workId) || null : null),
        [workId, works],
    );

    const currentExcerpt = useMemo(
        () => (currentWork && excerptId ? currentWork.excerpts.find((excerpt) => excerpt.id === excerptId) || null : null),
        [currentWork, excerptId],
    );

    const currentPoet = useMemo(
        () => (poetId ? poets.find((poet) => poet.id === poetId) || null : null),
        [poetId, poets],
    );

    const currentPoem = useMemo(
        () => (currentPoet && poemId ? currentPoet.poems.find((poem) => poem.id === poemId) || null : null),
        [currentPoet, poemId],
    );

    useEffect(() => {
        if (isLoading || !section) {
            return;
        }

        const shouldReload =
            (section === 'works' && Boolean(workId) && !currentWork)
            || (section === 'works' && workSubSection === 'excerpts' && Boolean(excerptId) && !currentExcerpt)
            || (section === 'poets' && Boolean(poetId) && !currentPoet)
            || (section === 'poets' && poetSubSection === 'poems' && Boolean(poemId) && !currentPoem);

        if (!shouldReload) {
            return;
        }

        const key = slug.join('/');
        if (missingEntityReloads.current[key]) {
            return;
        }

        missingEntityReloads.current[key] = true;
        void loadKnowledgeBase();
    }, [
        currentExcerpt,
        currentPoem,
        currentPoet,
        currentWork,
        excerptId,
        isLoading,
        loadKnowledgeBase,
        poetId,
        poetSubSection,
        poemId,
        section,
        slug,
        workId,
        workSubSection,
    ]);

    const addWorkAndOpen = useCallback(async () => {
        const nextWork = createEmptyWork();
        const nextWorks = [...works, nextWork];
        setWorks(nextWorks);
        const saved = await persistKnowledgeBase({ works: nextWorks, poets, block3 });
        if (!saved) return;
        router.push(buildMaterialsHref('works', nextWork.id));
    }, [block3, persistKnowledgeBase, poets, router, works]);

    const addPoetAndOpen = useCallback(async () => {
        const nextPoet = createEmptyPoet();
        const nextPoets = [...poets, nextPoet];
        setPoets(nextPoets);
        const saved = await persistKnowledgeBase({ works, poets: nextPoets, block3 });
        if (!saved) return;
        router.push(buildMaterialsHref('poets', nextPoet.id));
    }, [block3, persistKnowledgeBase, poets, router, works]);

    const addExcerpt = useCallback(async (targetWorkId: string, desiredOrder?: number) => {
        const target = works.find((work) => work.id === targetWorkId);
        const baseExcerpts = target?.excerpts || [];
        const nextOrder = desiredOrder ?? (baseExcerpts.length ? Math.max(...baseExcerpts.map((item) => item.order)) + 1 : 1);
        const nextExcerpt = createEmptyExcerpt(nextOrder);

        const nextWorks = works.map((work) => (
            work.id === targetWorkId
                ? { ...work, excerpts: insertExcerptAtOrder(work.excerpts, nextExcerpt, nextOrder) }
                : work
        ));
        setWorks(nextWorks);
        await persistKnowledgeBase({ works: nextWorks, poets, block3 });
    }, [block3, persistKnowledgeBase, poets, works]);

    const addPoemAndOpen = useCallback(async (targetPoetId: string) => {
        const nextPoem = createEmptyPoem();
        const nextPoets = poets.map((poet) => (
            poet.id === targetPoetId
                ? { ...poet, poems: [...poet.poems, nextPoem] }
                : poet
        ));
        setPoets(nextPoets);
        const saved = await persistKnowledgeBase({ works, poets: nextPoets, block3 });
        if (!saved) return;
        router.push(buildMaterialsHref('poets', targetPoetId, 'poems', nextPoem.id));
    }, [block3, persistKnowledgeBase, poets, router, works]);

    const addBlock3Question = useCallback(async (key: Block3Key) => {
        const next = createEmptyBlock3Question(key);
        const nextBlock3 = {
            ...block3,
            [key]: [...block3[key], next as never],
        };
        setBlock3(nextBlock3);
        await persistKnowledgeBase({ works, poets, block3: nextBlock3 });
    }, [block3, persistKnowledgeBase, poets, works]);

    const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
        const result: BreadcrumbItem[] = [{
            label: 'База заданий',
            href: buildMaterialsHref(),
        }];

        const sectionSiblings: BreadcrumbSibling[] = [
            { label: 'Произведения', href: buildMaterialsHref('works') },
            { label: 'Поэты и стихи', href: buildMaterialsHref('poets') },
            { label: 'Блок 3', href: buildMaterialsHref('block3') },
            { label: 'Оформление варианта', href: buildMaterialsHref('settings') },
        ];

        if (section) {
            const sectionLabel = section === 'works'
                ? 'Произведения'
                : section === 'poets'
                    ? 'Поэты и стихи'
                    : section === 'block3'
                        ? 'Блок 3'
                        : 'Оформление варианта';
            result.push({
                label: sectionLabel,
                href: buildMaterialsHref(section),
                siblings: sectionSiblings,
                addLabel: section === 'works' ? 'Добавить произведение' : section === 'poets' ? 'Добавить поэта' : undefined,
                onAdd: section === 'works' ? addWorkAndOpen : section === 'poets' ? addPoetAndOpen : undefined,
            });
        }

        if (section === 'works' && workId) {
            const workSectionSiblings: BreadcrumbSibling[] = [
                { label: 'Карточка произведения', href: buildMaterialsHref('works', workId) },
                { label: 'Отрывки', href: buildMaterialsHref('works', workId, 'excerpts') },
                { label: 'Общие вопросы', href: buildMaterialsHref('works', workId, 'common-questions') },
            ];

            result.push({
                label: currentWork?.title || workId,
                href: buildMaterialsHref('works', workId),
                siblings: works.map((work) => ({ label: work.title || work.id, href: buildMaterialsHref('works', work.id) })),
                addLabel: 'Добавить произведение',
                onAdd: addWorkAndOpen,
            });

            if (workSubSection) {
                result.push({
                    label:
                        workSubSection === 'excerpts'
                            ? 'Отрывки'
                            : workSubSection === 'common-questions'
                                ? 'Общие вопросы'
                                : 'Банк персонажей',
                    href: buildMaterialsHref('works', workId, workSubSection),
                    siblings: workSectionSiblings,
                    addLabel: workSubSection === 'excerpts' ? 'Добавить отрывок' : undefined,
                    onAdd: workSubSection === 'excerpts' && currentWork ? () => addExcerpt(currentWork.id) : undefined,
                });
            }

            if (workSubSection === 'excerpts') {
                if (excerptId) {
                    result.push({
                        label: currentExcerpt?.title || excerptId,
                        href: buildMaterialsHref('works', workId, 'excerpts', excerptId),
                        siblings: (currentWork?.excerpts || []).map((excerpt) => ({
                            label: excerpt.title || excerpt.id,
                            href: buildMaterialsHref('works', workId, 'excerpts', excerpt.id),
                        })),
                        addLabel: 'Добавить отрывок',
                        onAdd: currentWork ? () => addExcerpt(currentWork.id) : undefined,
                    });

                    if (excerptTaskKey) {
                        result.push({
                            label: EXCERPT_TASK_LABELS[excerptTaskKey],
                            href: buildMaterialsHref('works', workId, 'excerpts', excerptId, 'tasks', excerptTaskKey),
                            siblings: EXCERPT_TASK_KEYS.map((key) => ({
                                label: EXCERPT_TASK_LABELS[key],
                                href: buildMaterialsHref('works', workId, 'excerpts', excerptId, 'tasks', key),
                            })),
                        });

                        if (excerptQuestionIndex !== undefined) {
                            const item = currentExcerpt?.tasks[excerptTaskKey][excerptQuestionIndex];
                            result.push({
                                label: item?.id || `Вопрос ${excerptQuestionIndex + 1}`,
                                href: buildMaterialsHref('works', workId, 'excerpts', excerptId, 'tasks', excerptTaskKey, String(excerptQuestionIndex)),
                            });
                        }
                    }
                }
            }

            if (workSubSection === 'common-questions' && commonTaskKey) {
                result.push({
                    label: COMMON_TASK_LABELS[commonTaskKey],
                    href: buildMaterialsHref('works', workId, 'common-questions', commonTaskKey),
                    siblings: COMMON_TASK_KEYS.map((key) => ({
                        label: COMMON_TASK_LABELS[key],
                        href: buildMaterialsHref('works', workId, 'common-questions', key),
                    })),
                });

                if (commonQuestionIndex !== undefined) {
                    const item = currentWork?.commonTasks[commonTaskKey][commonQuestionIndex];
                    result.push({
                        label: item?.id || `Вопрос ${commonQuestionIndex + 1}`,
                        href: buildMaterialsHref('works', workId, 'common-questions', commonTaskKey, String(commonQuestionIndex)),
                    });
                }
            }

            if (workSubSection === 'characters' && charactersQuestionIndex !== undefined) {
                const item = currentWork?.characters[charactersQuestionIndex];
                result.push({
                    label: item?.name || item?.id || `Персонаж ${charactersQuestionIndex + 1}`,
                    href: buildMaterialsHref('works', workId, 'characters', String(charactersQuestionIndex)),
                });
            }
        }

        if (section === 'poets' && poetId) {
            result.push({
                label: currentPoet?.name || poetId,
                href: buildMaterialsHref('poets', poetId),
                siblings: poets.map((poet) => ({ label: poet.name || poet.id, href: buildMaterialsHref('poets', poet.id) })),
                addLabel: 'Добавить поэта',
                onAdd: addPoetAndOpen,
            });

            if (poetSubSection === 'poems') {
                result.push({
                    label: 'Стихи',
                    href: buildMaterialsHref('poets', poetId, 'poems'),
                    siblings: (currentPoet?.poems || []).map((poem) => ({
                        label: poem.title || poem.id,
                        href: buildMaterialsHref('poets', poetId, 'poems', poem.id),
                    })),
                    addLabel: 'Добавить стихотворение',
                    onAdd: currentPoet ? () => addPoemAndOpen(currentPoet.id) : undefined,
                });

                if (poemId) {
                    result.push({
                        label: currentPoem?.title || poemId,
                        href: buildMaterialsHref('poets', poetId, 'poems', poemId),
                        siblings: (currentPoet?.poems || []).map((poem) => ({
                            label: poem.title || poem.id,
                            href: buildMaterialsHref('poets', poetId, 'poems', poem.id),
                        })),
                        addLabel: 'Добавить стихотворение',
                        onAdd: currentPoet ? () => addPoemAndOpen(currentPoet.id) : undefined,
                    });

                    if (poemTaskKey) {
                        result.push({
                            label: POEM_TASK_LABELS[poemTaskKey],
                            href: buildMaterialsHref('poets', poetId, 'poems', poemId, 'tasks', poemTaskKey),
                            siblings: POEM_TASK_KEYS.map((key) => ({
                                label: POEM_TASK_LABELS[key],
                                href: buildMaterialsHref('poets', poetId, 'poems', poemId, 'tasks', key),
                            })),
                        });

                        if (poemQuestionIndex !== undefined) {
                            const item = currentPoem?.tasks[poemTaskKey][poemQuestionIndex];
                            result.push({
                                label: item?.id || `Вопрос ${poemQuestionIndex + 1}`,
                                href: buildMaterialsHref('poets', poetId, 'poems', poemId, 'tasks', poemTaskKey, String(poemQuestionIndex)),
                            });
                        }
                    }
                }
            }
        }

        if (section === 'block3' && block3Key) {
            result.push({
                label: BLOCK3_LABELS[block3Key] || block3Key,
                href: buildMaterialsHref('block3', block3Key),
                siblings: (Object.keys(BLOCK3_LABELS) as Block3Key[]).map((key) => ({
                    label: BLOCK3_LABELS[key],
                    href: buildMaterialsHref('block3', key),
                })),
                addLabel: `Добавить вопрос ${BLOCK3_LABELS[block3Key]}`,
                onAdd: () => addBlock3Question(block3Key),
            });

            if (block3QuestionIndex !== undefined) {
                const item = block3[block3Key][block3QuestionIndex];
                result.push({
                    label: item?.id || `Вопрос ${block3QuestionIndex + 1}`,
                    href: buildMaterialsHref('block3', block3Key, String(block3QuestionIndex)),
                });
            }
        }

        return result;
    }, [
        addBlock3Question,
        addExcerpt,
        addPoemAndOpen,
        addPoetAndOpen,
        addWorkAndOpen,
        block3,
        block3Key,
        block3QuestionIndex,
        charactersQuestionIndex,
        commonQuestionIndex,
        commonTaskKey,
        currentExcerpt,
        currentPoem,
        currentPoet,
        currentWork,
        excerptId,
        excerptQuestionIndex,
        excerptTaskKey,
        poetId,
        poetSubSection,
        poemId,
        poemQuestionIndex,
        poemTaskKey,
        poets,
        section,
        workId,
        workSubSection,
        works,
    ]);

    const renderRoot = () => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href={buildMaterialsHref('works')} className="bg-white border border-[#221E20]/10 rounded-xl p-5 hover:border-[#221E20]/30 transition-colors">
                    <p className="font-bold">Произведения</p>
                    <p className="text-sm opacity-60 mt-1">{works.length} шт.</p>
                </Link>
                <Link href={buildMaterialsHref('poets')} className="bg-white border border-[#221E20]/10 rounded-xl p-5 hover:border-[#221E20]/30 transition-colors">
                    <p className="font-bold">Поэты и стихи</p>
                    <p className="text-sm opacity-60 mt-1">{poets.length} шт.</p>
                </Link>
                <Link href={buildMaterialsHref('block3')} className="bg-white border border-[#221E20]/10 rounded-xl p-5 hover:border-[#221E20]/30 transition-colors">
                    <p className="font-bold">Блок 3 (11.1–11.5)</p>
                    <p className="text-sm opacity-60 mt-1">
                        Всего: {block3.task11_1.length + block3.task11_2_3.length + block3.task11_4.length + block3.task11_5.length}
                    </p>
                </Link>
                <Link href={buildMaterialsHref('settings')} className="bg-white border border-[#221E20]/10 rounded-xl p-5 hover:border-[#221E20]/30 transition-colors">
                    <p className="font-bold">Оформление варианта</p>
                    <p className="text-sm opacity-60 mt-1">Интро-тексты и критерии</p>
                </Link>
            </div>
        );
    };

    const renderSettingsPage = () => {
        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-5 space-y-5">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold">Оформление варианта</h2>
                    <p className="text-sm opacity-60">
                        Эти тексты показываются на странице варианта в свёрнутом виде с кнопкой разворота.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5">
                    <RichTextField
                        label="Часть 1: вводный текст"
                        value={settings.variantTexts.part1Intro}
                        onChange={(value) => setSettings((prev) => ({
                            ...prev,
                            variantTexts: { ...prev.variantTexts, part1Intro: value },
                        }))}
                        minHeight={140}
                    />
                    <RichTextField
                        label="Часть 1: формулировка перед заданиями 1–3"
                        value={settings.variantTexts.part1QuestionsIntro}
                        onChange={(value) => setSettings((prev) => ({
                            ...prev,
                            variantTexts: { ...prev.variantTexts, part1QuestionsIntro: value },
                        }))}
                        minHeight={120}
                    />
                    <RichTextField
                        label="Часть 1: блок перед 4.1/4.2 (курсив/жирный)"
                        value={settings.variantTexts.part1Task4Lead}
                        onChange={(value) => setSettings((prev) => ({
                            ...prev,
                            variantTexts: { ...prev.variantTexts, part1Task4Lead: value },
                        }))}
                        minHeight={140}
                    />
                    <RichTextField
                        label="Часть 1: критерии к заданиям 4–5"
                        value={settings.variantTexts.part1Criteria}
                        onChange={(value) => setSettings((prev) => ({
                            ...prev,
                            variantTexts: { ...prev.variantTexts, part1Criteria: value },
                        }))}
                        minHeight={140}
                    />
                    <RichTextField
                        label="Часть 1: блок перед заданием 5"
                        value={settings.variantTexts.part1Task5Lead}
                        onChange={(value) => setSettings((prev) => ({
                            ...prev,
                            variantTexts: { ...prev.variantTexts, part1Task5Lead: value },
                        }))}
                        minHeight={140}
                    />
                    <RichTextField
                        label="Часть 2: вводный текст"
                        value={settings.variantTexts.part2Intro}
                        onChange={(value) => setSettings((prev) => ({
                            ...prev,
                            variantTexts: { ...prev.variantTexts, part2Intro: value },
                        }))}
                        minHeight={140}
                    />
                    <RichTextField
                        label="Часть 2: блок перед заданиями 6–8"
                        value={settings.variantTexts.part2QuestionsIntro}
                        onChange={(value) => setSettings((prev) => ({
                            ...prev,
                            variantTexts: { ...prev.variantTexts, part2QuestionsIntro: value },
                        }))}
                        minHeight={120}
                    />
                    <RichTextField
                        label="Часть 2: блок перед заданиями 9.1/9.2 (первый)"
                        value={settings.variantTexts.part2Task9Lead}
                        onChange={(value) => setSettings((prev) => ({
                            ...prev,
                            variantTexts: { ...prev.variantTexts, part2Task9Lead: value },
                        }))}
                        minHeight={140}
                    />
                    <RichTextField
                        label="Часть 2: блок перед заданиями 9.1/9.2 (второй)"
                        value={settings.variantTexts.part2Task9Criteria}
                        onChange={(value) => setSettings((prev) => ({
                            ...prev,
                            variantTexts: { ...prev.variantTexts, part2Task9Criteria: value },
                        }))}
                        minHeight={140}
                    />
                    <RichTextField
                        label="Часть 2: блок перед заданием 10"
                        value={settings.variantTexts.part2Task10Lead}
                        onChange={(value) => setSettings((prev) => ({
                            ...prev,
                            variantTexts: { ...prev.variantTexts, part2Task10Lead: value },
                        }))}
                        minHeight={140}
                    />
                    <RichTextField
                        label="Часть 2 (задания 11): вводный текст"
                        value={settings.variantTexts.part3Intro}
                        onChange={(value) => setSettings((prev) => ({
                            ...prev,
                            variantTexts: { ...prev.variantTexts, part3Intro: value },
                        }))}
                        minHeight={140}
                    />
                </div>
            </section>
        );
    };

    const renderWorksList = () => {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">Произведения</h2>
                </div>

                <div className="space-y-3">
                    {works.map((work) => (
                        <div key={work.id} className="relative bg-white border border-[#221E20]/10 rounded-xl p-4 hover:border-[#221E20]/30 hover:bg-black/[0.02] transition-colors">
                            <Link href={buildMaterialsHref('works', work.id)} className="absolute inset-0 z-10 rounded-xl" aria-label={`Открыть произведение ${work.title || work.id}`} />
                            <div className="relative z-20 flex items-center justify-between gap-3 pointer-events-none">
                                <div>
                                    <p className="font-bold">{work.title || 'Без названия'}</p>
                                    <p className="text-sm opacity-60">{work.author || 'Без автора'} · отрывков: {work.excerpts.length}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outlined"
                                        className="relative z-30 text-red-600 border-red-100 pointer-events-auto"
                                        onClick={() => {
                                            if (!window.confirm(`Удалить произведение «${work.title || work.id}»?`)) return;
                                            const nextWorks = works.filter((item) => item.id !== work.id);
                                            setWorks(nextWorks);
                                            void persistKnowledgeBase({ works: nextWorks, poets, block3 });
                                        }}
                                    >
                                        <IoTrashOutline size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-2 flex justify-end">
                    <Button variant="outlined" className="flex items-center gap-2" onClick={addWorkAndOpen}>
                        <IoAddOutline size={16} /> Добавить произведение
                    </Button>
                </div>
            </div>
        );
    };

    const renderWorkDetail = () => {
        if (!currentWork) {
            return <NotFoundPane title="Произведение не найдено" onBack={() => router.push(buildMaterialsHref('works'))} />;
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">{currentWork.title || 'Произведение'}</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outlined"
                            className="text-red-600 border-red-100"
                            onClick={() => {
                                if (!window.confirm(`Удалить произведение «${currentWork.title || currentWork.id}»?`)) return;
                                const nextWorks = works.filter((item) => item.id !== currentWork.id);
                                setWorks(nextWorks);
                                void persistKnowledgeBase({ works: nextWorks, poets, block3 });
                                router.push(buildMaterialsHref('works'));
                            }}
                        >
                            <IoTrashOutline size={16} />
                        </Button>
                    </div>
                </div>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Link
                        href={buildMaterialsHref('works', currentWork.id, 'excerpts')}
                        className="bg-white border border-[#221E20]/10 rounded-xl p-4 hover:border-[#221E20]/30 transition-colors"
                    >
                        <p className="font-bold">Отрывки</p>
                        <p className="text-sm opacity-60 mt-1">{currentWork.excerpts.length} шт.</p>
                    </Link>
                    <Link
                        href={buildMaterialsHref('works', currentWork.id, 'common-questions')}
                        className="bg-white border border-[#221E20]/10 rounded-xl p-4 hover:border-[#221E20]/30 transition-colors"
                    >
                        <p className="font-bold">Общие вопросы</p>
                        <p className="text-sm opacity-60 mt-1">
                            {currentWork.commonTasks.task1.length + currentWork.commonTasks.task2.length + currentWork.commonTasks.task3.length} шт.
                        </p>
                    </Link>
                </section>

                <section className="bg-white border border-[#221E20]/10 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <TextField label="Название" value={currentWork.title} onChange={(value) => replaceWork(currentWork.id, (item) => ({ ...item, title: value }))} />
                    <TextField label="Автор" value={currentWork.author} onChange={(value) => replaceWork(currentWork.id, (item) => ({ ...item, author: value }))} />
                    <TextField compact label="Идентификатор автора" value={currentWork.authorId} onChange={(value) => replaceWork(currentWork.id, (item) => ({ ...item, authorId: value }))} />
                    <TextField compact label="Идентификатор произведения" value={currentWork.workId} onChange={(value) => replaceWork(currentWork.id, (item) => ({ ...item, workId: value }))} />
                    <div className={DETAIL_FULL_WIDTH_CLASS}>
                        <TextField label="Внутренние теги" value={currentWork.internalTags} onChange={(value) => replaceWork(currentWork.id, (item) => ({ ...item, internalTags: value }))} />
                    </div>
                    <div className={DETAIL_FULL_WIDTH_CLASS}>
                        <TextField label="Публичные теги" value={currentWork.externalTags} onChange={(value) => replaceWork(currentWork.id, (item) => ({ ...item, externalTags: value }))} />
                    </div>
                    <div className={DETAIL_FULL_WIDTH_CLASS}>
                        <Checkbox
                            checked={currentWork.age18}
                            onChange={(event) => replaceWork(currentWork.id, (item) => ({ ...item, age18: event.target.checked }))}
                            label="18+"
                        />
                    </div>
                </section>
            </div>
        );
    };

    const renderCommonQuestionsPage = (taskKey?: CommonTaskKey, selectedIndex?: number) => {
        if (!currentWork) {
            return <NotFoundPane title="Произведение не найдено" onBack={() => router.push(buildMaterialsHref('works'))} />;
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">
                        Общие вопросы: {currentWork.title}
                        {taskKey ? ` · ${COMMON_TASK_LABELS[taskKey]}` : ''}
                    </h2>
                    <div className="flex items-center gap-2">
                        {taskKey ? (
                            <Button variant="outlined" onClick={() => router.push(buildMaterialsHref('works', currentWork.id, 'common-questions'))}>
                                К заданиям
                            </Button>
                        ) : null}
                        <Button variant="outlined" onClick={() => router.push(buildMaterialsHref('works', currentWork.id))}>
                            К карточке произведения
                        </Button>
                    </div>
                </div>

                <CommonTasksEditor
                    value={currentWork.commonTasks}
                    baseHref={buildMaterialsHref('works', currentWork.id, 'common-questions')}
                    taskKey={taskKey}
                    selectedIndex={selectedIndex}
                    onChange={(value) => {
                        const previousSignature = getCommonTasksCountSignature(currentWork.commonTasks);
                        const nextSignature = getCommonTasksCountSignature(value);
                        const nextWorks = works.map((work) => (
                            work.id === currentWork.id
                                ? { ...work, commonTasks: value }
                                : work
                        ));
                        setWorks(nextWorks);
                        if (previousSignature !== nextSignature) {
                            void persistKnowledgeBase({ works: nextWorks, poets, block3 });
                        }
                    }}
                />
            </div>
        );
    };

    const renderCharactersPage = (selectedIndex?: number) => {
        if (!currentWork) {
            return <NotFoundPane title="Произведение не найдено" onBack={() => router.push(buildMaterialsHref('works'))} />;
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">Банк персонажей: {currentWork.title}</h2>
                    <Button variant="outlined" onClick={() => router.push(buildMaterialsHref('works', currentWork.id))}>
                        К карточке произведения
                    </Button>
                </div>

                <CharactersEditor
                    items={currentWork.characters}
                    hideTitle
                    baseHref={buildMaterialsHref('works', currentWork.id, 'characters')}
                    selectedIndex={selectedIndex}
                    onChange={(value) => replaceWork(currentWork.id, (item) => ({ ...item, characters: value }))}
                />
            </div>
        );
    };

    const renderExcerptsList = () => {
        if (!currentWork) {
            return <NotFoundPane title="Произведение не найдено" onBack={() => router.push(buildMaterialsHref('works'))} />;
        }

        const orderedExcerpts = sortByExcerptOrder(currentWork.excerpts);

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">Отрывки: {currentWork.title}</h2>
                </div>

                <div className="space-y-3">
                    {orderedExcerpts.map((excerpt) => (
                        <div key={excerpt.id} className="group relative bg-white border border-[#221E20]/10 rounded-xl p-4 space-y-3 hover:border-[#221E20]/30 hover:bg-black/[0.02] transition-colors">
                            <Link href={buildMaterialsHref('works', currentWork.id, 'excerpts', excerpt.id)} className="absolute inset-0 z-10 rounded-xl" aria-label={`Открыть отрывок ${excerpt.title || excerpt.id}`} />
                            <div className="relative z-20 flex items-center justify-between gap-3 pointer-events-none">
                                <div>
                                    <p className="flex items-center gap-1.5 font-bold"><StatusChip isActive={excerpt.isActive} />{excerpt.title || excerpt.id}</p>
                                    <p className="text-sm opacity-60">Порядок: {excerpt.order} · идентификатор: {excerpt.excerptId}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outlined"
                                        className="relative z-30 text-red-600 border-red-100 pointer-events-auto"
                                        onClick={() => {
                                            if (!window.confirm(`Удалить отрывок «${excerpt.title || excerpt.id}»?`)) return;
                                            const nextExcerpts = currentWork.excerpts.filter((entry) => entry.id !== excerpt.id);
                                            const nextWorks = works.map((w) => w.id === currentWork.id ? { ...w, excerpts: nextExcerpts } : w);
                                            setWorks(nextWorks);
                                            void persistKnowledgeBase({ works: nextWorks, poets, block3 });
                                        }}
                                    >
                                        <IoTrashOutline size={16} />
                                    </Button>
                                </div>
                            </div>
                            <div className="relative z-30 hidden group-hover:flex justify-end pt-2 border-t border-dashed border-[#221E20]/10">
                                <Button
                                    variant="outlined"
                                    className="flex items-center gap-2"
                                    onClick={() => addExcerpt(currentWork.id, excerpt.order + 1)}
                                >
                                    <IoAddOutline size={16} /> Добавить после
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-2 flex justify-end">
                    <Button variant="outlined" className="flex items-center gap-2" onClick={() => addExcerpt(currentWork.id)}>
                        <IoAddOutline size={16} /> Добавить отрывок
                    </Button>
                </div>
            </div>
        );
    };

    const renderExcerptDetail = (taskKey?: ExcerptTaskKey, selectedIndex?: number) => {
        if (!currentWork || !currentExcerpt) {
            return <NotFoundPane title="Отрывок не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
        }

        const updateExcerpt = (updater: (excerpt: Excerpt) => Excerpt) => {
            replaceWork(currentWork.id, (work) => ({
                ...work,
                excerpts: work.excerpts.map((excerpt) => (excerpt.id === currentExcerpt.id ? updater(excerpt) : excerpt)),
            }));
        };

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">
                        {currentExcerpt.title || currentExcerpt.id}
                        {taskKey ? ` · ${EXCERPT_TASK_LABELS[taskKey]}` : ''}
                    </h2>
                    <div className="flex items-center gap-2">
                        {taskKey ? (
                            <Button variant="outlined" onClick={() => router.push(buildMaterialsHref('works', currentWork.id, 'excerpts', currentExcerpt.id))}>
                                К заданиям
                            </Button>
                        ) : null}
                        <Button
                            variant="outlined"
                            className="text-red-600 border-red-100"
                            onClick={() => {
                                if (!window.confirm(`Удалить отрывок «${currentExcerpt.title || currentExcerpt.id}»?`)) return;
                                const nextExcerpts = currentWork.excerpts.filter((entry) => entry.id !== currentExcerpt.id);
                                const nextWorks = works.map((w) => w.id === currentWork.id ? { ...w, excerpts: nextExcerpts } : w);
                                setWorks(nextWorks);
                                void persistKnowledgeBase({ works: nextWorks, poets, block3 });
                                router.push(buildMaterialsHref('works', currentWork.id, 'excerpts'));
                            }}
                        >
                            <IoTrashOutline size={16} />
                        </Button>
                    </div>
                </div>

                <ExcerptTasksEditor
                    value={currentExcerpt.tasks}
                    baseHref={buildMaterialsHref('works', currentWork.id, 'excerpts', currentExcerpt.id)}
                    taskKey={taskKey}
                    selectedIndex={selectedIndex}
                    onChange={(value) => {
                        const previousSignature = getExcerptTasksCountSignature(currentExcerpt.tasks);
                        const nextSignature = getExcerptTasksCountSignature(value);
                        const nextWorks = works.map((work) => {
                            if (work.id !== currentWork.id) return work;
                            return {
                                ...work,
                                excerpts: work.excerpts.map((excerpt) => (
                                    excerpt.id === currentExcerpt.id
                                        ? { ...excerpt, tasks: value }
                                        : excerpt
                                )),
                            };
                        });
                        setWorks(nextWorks);
                        if (previousSignature !== nextSignature) {
                            void persistKnowledgeBase({ works: nextWorks, poets, block3 });
                        }
                    }}
                />

                {!taskKey ? (
                    <section className="bg-white border border-[#221E20]/10 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <TextField label="Название" value={currentExcerpt.title} onChange={(value) => updateExcerpt((item) => ({ ...item, title: value }))} />
                        <TextField label="Глава" value={currentExcerpt.chapter || ''} onChange={(value) => updateExcerpt((item) => ({ ...item, chapter: value }))} />
                        <TextField compact label="Идентификатор отрывка" value={currentExcerpt.excerptId} onChange={(value) => updateExcerpt((item) => ({ ...item, excerptId: value }))} />
                        <TextField compact label="Тема (исключающий тег)" value={currentExcerpt.themeInternalId || ''} onChange={(value) => updateExcerpt((item) => ({ ...item, themeInternalId: value }))} />
                        <StatusField value={currentExcerpt.isActive} onChange={(value) => updateExcerpt((item) => ({ ...item, isActive: value }))} />
                        <TextField
                            compact
                            label="Порядок"
                            value={String(currentExcerpt.order)}
                            onChange={(value) => {
                                const parsed = Number.parseInt(value.trim(), 10);
                                if (!Number.isFinite(parsed) || parsed < 1) return;
                                const nextWorks = works.map((work) => {
                                    if (work.id !== currentWork.id) return work;
                                    return {
                                        ...work,
                                        excerpts: moveExcerptToOrder(work.excerpts, currentExcerpt.id, parsed),
                                    };
                                });
                                setWorks(nextWorks);
                            }}
                        />
                        <label className="flex flex-col gap-1">
                            <FieldLabel>Колонки текста</FieldLabel>
                            <select
                                value={currentExcerpt.textColumns === 2 ? '2' : '1'}
                                onChange={(event) => {
                                    const nextColumns = event.target.value === '2' ? 2 : 1;
                                    updateExcerpt((item) => ({
                                        ...item,
                                        textColumns: nextColumns as 1 | 2,
                                        textSecondColumn: item.textSecondColumn || '',
                                    }));
                                }}
                                className="h-[40px] rounded-lg border border-[#221E20]/15 bg-white px-3 text-sm outline-none focus:border-[#221E20]"
                            >
                                <option value="1">Одна колонка</option>
                                <option value="2">Две колонки</option>
                            </select>
                        </label>
                        <div className={DETAIL_FULL_WIDTH_CLASS}>
                            {currentExcerpt.textColumns === 2 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <RichTextField
                                        label="Текст отрывка: колонка 1"
                                        value={currentExcerpt.text}
                                        onChange={(value) => updateExcerpt((item) => ({ ...item, text: value }))}
                                        minHeight={320}
                                    />
                                    <RichTextField
                                        label="Текст отрывка: колонка 2"
                                        value={currentExcerpt.textSecondColumn || ''}
                                        onChange={(value) => updateExcerpt((item) => ({ ...item, textSecondColumn: value }))}
                                        minHeight={320}
                                    />
                                </div>
                            ) : (
                                <RichTextField
                                    label="Текст отрывка"
                                    value={currentExcerpt.text}
                                    onChange={(value) => updateExcerpt((item) => ({ ...item, text: value }))}
                                    minHeight={320}
                                />
                            )}
                        </div>
                    </section>
                ) : null}
            </div>
        );
    };

    const renderPoetsList = () => {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">Поэты и стихи</h2>
                </div>

                <div className="space-y-3">
                    {poets.map((poet) => (
                        <div key={poet.id} className="relative bg-white border border-[#221E20]/10 rounded-xl p-4 hover:border-[#221E20]/30 hover:bg-black/[0.02] transition-colors">
                            <Link href={buildMaterialsHref('poets', poet.id)} className="absolute inset-0 z-10 rounded-xl" aria-label={`Открыть автора ${poet.name || poet.id}`} />
                            <div className="relative z-20 flex items-center justify-between gap-3 pointer-events-none">
                                <div>
                                    <p className="font-bold">{poet.name || poet.id}</p>
                                    <p className="text-sm opacity-60">Идентификатор автора: {poet.authorId || '—'} · стихов: {poet.poems.length}</p>
                                </div>
                                <Button
                                    variant="outlined"
                                    className="relative z-30 text-red-600 border-red-100 pointer-events-auto"
                                    onClick={() => {
                                        if (!window.confirm(`Удалить автора «${poet.name || poet.id}»?`)) return;
                                        const nextPoets = poets.filter((item) => item.id !== poet.id);
                                        setPoets(nextPoets);
                                        void persistKnowledgeBase({ works, poets: nextPoets, block3 });
                                    }}
                                >
                                    <IoTrashOutline size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-2 flex justify-end">
                    <Button variant="outlined" className="flex items-center gap-2" onClick={addPoetAndOpen}>
                        <IoAddOutline size={16} /> Добавить поэта
                    </Button>
                </div>
            </div>
        );
    };

    const renderPoetDetail = () => {
        if (!currentPoet) {
            return <NotFoundPane title="Автор не найден" onBack={() => router.push(buildMaterialsHref('poets'))} />;
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">{currentPoet.name || currentPoet.id}</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outlined"
                            className="text-red-600 border-red-100"
                            onClick={() => {
                                if (!window.confirm(`Удалить автора «${currentPoet.name || currentPoet.id}»?`)) return;
                                const nextPoets = poets.filter((item) => item.id !== currentPoet.id);
                                setPoets(nextPoets);
                                void persistKnowledgeBase({ works, poets: nextPoets, block3 });
                                router.push(buildMaterialsHref('poets'));
                            }}
                        >
                            <IoTrashOutline size={16} />
                        </Button>
                    </div>
                </div>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Link
                        href={buildMaterialsHref('poets', currentPoet.id, 'poems')}
                        className="bg-white border border-[#221E20]/10 rounded-xl p-4 hover:border-[#221E20]/30 transition-colors"
                    >
                        <p className="font-bold">Стихи</p>
                        <p className="text-sm opacity-60 mt-1">{currentPoet.poems.length} шт.</p>
                    </Link>
                </section>

                <section className="bg-white border border-[#221E20]/10 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <TextField label="Имя" value={currentPoet.name} onChange={(value) => replacePoet(currentPoet.id, (item) => ({ ...item, name: value }))} />
                    <TextField compact label="Идентификатор автора" value={currentPoet.authorId} onChange={(value) => replacePoet(currentPoet.id, (item) => ({ ...item, authorId: value }))} />
                </section>
            </div>
        );
    };

    const renderPoemsList = () => {
        if (!currentPoet) {
            return <NotFoundPane title="Автор не найден" onBack={() => router.push(buildMaterialsHref('poets'))} />;
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">Стихи: {currentPoet.name}</h2>
                </div>

                <div className="space-y-3">
                    {currentPoet.poems.map((poem) => (
                        <div key={poem.id} className="relative bg-white border border-[#221E20]/10 rounded-xl p-4 hover:border-[#221E20]/30 hover:bg-black/[0.02] transition-colors">
                            <Link href={buildMaterialsHref('poets', currentPoet.id, 'poems', poem.id)} className="absolute inset-0 z-10 rounded-xl" aria-label={`Открыть стихотворение ${poem.title || poem.id}`} />
                            <div className="relative z-20 flex items-center justify-between gap-3 pointer-events-none">
                                <div>
                                    <p className="flex items-center gap-1.5 font-bold"><StatusChip isActive={poem.isActive} />{poem.title || poem.id}</p>
                                    <p className="text-sm opacity-60">Идентификатор стихотворения: {poem.poemId || '—'}</p>
                                </div>
                                <Button
                                    variant="outlined"
                                    className="relative z-30 text-red-600 border-red-100 pointer-events-auto"
                                    onClick={() => {
                                        if (!window.confirm(`Удалить стихотворение «${poem.title || poem.id}»?`)) return;
                                        const nextPoems = currentPoet.poems.filter((entry) => entry.id !== poem.id);
                                        const nextPoets = poets.map((p) => p.id === currentPoet.id ? { ...p, poems: nextPoems } : p);
                                        setPoets(nextPoets);
                                        void persistKnowledgeBase({ works, poets: nextPoets, block3 });
                                    }}
                                >
                                    <IoTrashOutline size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-2 flex justify-end">
                    <Button variant="outlined" className="flex items-center gap-2" onClick={() => addPoemAndOpen(currentPoet.id)}>
                        <IoAddOutline size={16} /> Добавить стихотворение
                    </Button>
                </div>
            </div>
        );
    };

    const renderPoemDetail = (taskKey?: PoemTaskKey, selectedIndex?: number) => {
        if (!currentPoet || !currentPoem) {
            return <NotFoundPane title="Стихотворение не найдено" onBack={() => router.push(buildMaterialsHref('poets'))} />;
        }

        const updatePoem = (updater: (poem: Poem) => Poem) => {
            replacePoet(currentPoet.id, (poet) => ({
                ...poet,
                poems: poet.poems.map((poem) => (poem.id === currentPoem.id ? updater(poem) : poem)),
            }));
        };

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">
                        {currentPoem.title || currentPoem.id}
                        {taskKey ? ` · ${POEM_TASK_LABELS[taskKey]}` : ''}
                    </h2>
                    <div className="flex items-center gap-2">
                        {taskKey ? (
                            <Button variant="outlined" onClick={() => router.push(buildMaterialsHref('poets', currentPoet.id, 'poems', currentPoem.id))}>
                                К заданиям
                            </Button>
                        ) : null}
                        <Button
                            variant="outlined"
                            className="text-red-600 border-red-100"
                            onClick={() => {
                                if (!window.confirm(`Удалить стихотворение «${currentPoem.title || currentPoem.id}»?`)) return;
                                const nextPoems = currentPoet.poems.filter((entry) => entry.id !== currentPoem.id);
                                const nextPoets = poets.map((p) => p.id === currentPoet.id ? { ...p, poems: nextPoems } : p);
                                setPoets(nextPoets);
                                void persistKnowledgeBase({ works, poets: nextPoets, block3 });
                                router.push(buildMaterialsHref('poets', currentPoet.id, 'poems'));
                            }}
                        >
                            <IoTrashOutline size={16} />
                        </Button>
                    </div>
                </div>

                <PoemTasksEditor
                    value={currentPoem.tasks}
                    baseHref={buildMaterialsHref('poets', currentPoet.id, 'poems', currentPoem.id)}
                    taskKey={taskKey}
                    selectedIndex={selectedIndex}
                    onChange={(value) => {
                        const previousSignature = getPoemTasksCountSignature(currentPoem.tasks);
                        const nextSignature = getPoemTasksCountSignature(value);
                        const nextPoets = poets.map((poet) => {
                            if (poet.id !== currentPoet.id) return poet;
                            return {
                                ...poet,
                                poems: poet.poems.map((poem) => (
                                    poem.id === currentPoem.id
                                        ? { ...poem, tasks: value }
                                        : poem
                                )),
                            };
                        });
                        setPoets(nextPoets);
                        if (previousSignature !== nextSignature) {
                            void persistKnowledgeBase({ works, poets: nextPoets, block3 });
                        }
                    }}
                />

                {!taskKey ? (
                    <section className="bg-white border border-[#221E20]/10 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <TextField label="Название" value={currentPoem.title} onChange={(value) => updatePoem((item) => ({ ...item, title: value }))} />
                        <TextField compact label="Идентификатор стихотворения" value={currentPoem.poemId} onChange={(value) => updatePoem((item) => ({ ...item, poemId: value }))} />
                        <TextField compact label="Тема (исключающий тег)" value={currentPoem.themeInternalId || ''} onChange={(value) => updatePoem((item) => ({ ...item, themeInternalId: value }))} />
                        <StatusField value={currentPoem.isActive} onChange={(value) => updatePoem((item) => ({ ...item, isActive: value }))} />
                        <label className="flex flex-col gap-1">
                            <FieldLabel>Колонки текста</FieldLabel>
                            <select
                                value={currentPoem.textColumns === 2 ? '2' : '1'}
                                onChange={(event) => {
                                    const nextColumns = event.target.value === '2' ? 2 : 1;
                                    updatePoem((item) => ({
                                        ...item,
                                        textColumns: nextColumns as 1 | 2,
                                        textSecondColumn: item.textSecondColumn || '',
                                    }));
                                }}
                                className="h-[40px] rounded-lg border border-[#221E20]/15 bg-white px-3 text-sm outline-none focus:border-[#221E20]"
                            >
                                <option value="1">Одна колонка</option>
                                <option value="2">Две колонки</option>
                            </select>
                        </label>
                        <div className={DETAIL_FULL_WIDTH_CLASS}>
                            <Checkbox
                                checked={currentPoem.age18}
                                onChange={(event) => updatePoem((item) => ({ ...item, age18: event.target.checked }))}
                                label="18+"
                            />
                        </div>
                        <div className={DETAIL_FULL_WIDTH_CLASS}>
                            {currentPoem.textColumns === 2 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <RichTextField
                                        label="Текст стихотворения: колонка 1"
                                        value={currentPoem.text}
                                        onChange={(value) => updatePoem((item) => ({ ...item, text: value }))}
                                        minHeight={320}
                                    />
                                    <RichTextField
                                        label="Текст стихотворения: колонка 2"
                                        value={currentPoem.textSecondColumn || ''}
                                        onChange={(value) => updatePoem((item) => ({ ...item, textSecondColumn: value }))}
                                        minHeight={320}
                                    />
                                </div>
                            ) : (
                                <RichTextField
                                    label="Текст стихотворения"
                                    value={currentPoem.text}
                                    onChange={(value) => updatePoem((item) => ({ ...item, text: value }))}
                                    minHeight={320}
                                />
                            )}
                        </div>
                    </section>
                ) : null}
            </div>
        );
    };

    const renderBlock3Root = () => {
        const entries = (Object.keys(BLOCK3_LABELS) as Block3Key[]).map((key) => ({
            key,
            label: BLOCK3_LABELS[key],
            count: block3[key].length,
            activeCount: countActiveItems(block3[key]),
        }));

        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold">Блок 3 (11.1–11.5)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {entries.map((entry) => (
                        <Link
                            key={entry.key}
                            href={buildMaterialsHref('block3', entry.key)}
                            className="bg-white border border-[#221E20]/10 rounded-xl px-3 py-2 hover:border-[#221E20]/30 transition-colors"
                        >
                            <p className="font-bold">Вопросы {entry.label}</p>
                            <p className="text-sm opacity-60 mt-1">Активно: {entry.activeCount} / {entry.count}</p>
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    const renderBlock3Group = (selectedIndex?: number) => {
        if (!block3Key || !Object.prototype.hasOwnProperty.call(BLOCK3_LABELS, block3Key)) {
            return <NotFoundPane title="Группа блока 3 не найдена" onBack={() => router.push(buildMaterialsHref('block3'))} />;
        }

        const items = block3[block3Key];
        const isDetailPage = Number.isInteger(selectedIndex) && selectedIndex !== undefined;
        const currentItem = isDetailPage ? items[selectedIndex!] : null;

        const updateItem = (index: number, updater: (value: Block3Question | Block3QuestionMultiAuthor) => Block3Question | Block3QuestionMultiAuthor) => {
            setBlock3((prev) => ({
                ...prev,
                [block3Key]: prev[block3Key].map((item, itemIndex) => (itemIndex === index ? updater(item) as never : item)),
            }));
        };

        if (!isDetailPage) {
            return (
                <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                    <h2 className="text-xl font-bold">Вопросы {BLOCK3_LABELS[block3Key]}</h2>

                    <div className="space-y-2">
                        {items.map((item, index) => {
                            const itemHref = buildMaterialsHref('block3', block3Key, String(index));
                            return (
                                <CompactQuestionRow
                                    key={`${item.id}-${index}`}
                                    index={index}
                                    title={toQuestionPreview(item.text || '', 'Без формулировки')}
                                    meta={buildMetaParts([
                                        `ID: ${item.id || '—'}`,
                                        'authorId' in item && item.authorId ? `Автор: ${item.authorId}` : null,
                                        'authorIds' in item && item.authorIds.length ? `Авторы: ${item.authorIds.join(', ')}` : null,
                                        item.termId ? `Термин: ${item.termId}` : null,
                                        item.themeInternalId ? `Тема: ${item.themeInternalId}` : null,
                                        'rodId' in item && item.rodId ? `Род: ${item.rodId}` : null,
                                        item.publicId ? `Публичный ID: ${item.publicId}` : null,
                                        item.tags ? `Теги: ${item.tags}` : null,
                                        'special' in item && item.special ? 'Спец. вопрос' : null,
                                    ])}
                                    isActive={item.isActive}
                                    href={itemHref}
                                    ariaLabel={`Открыть запись #${index + 1}`}
                                    onDelete={() => {
                                        if (!window.confirm('Удалить запись?')) return;
                                        const nextBlock3 = {
                                            ...block3,
                                            [block3Key]: block3[block3Key].filter((_, itemIndex) => itemIndex !== index),
                                        };
                                        setBlock3(nextBlock3);
                                        void persistKnowledgeBase({ works, poets, block3: nextBlock3 });
                                    }}
                                />
                            );
                        })}
                        {!items.length ? <p className="text-sm opacity-60">Пока нет записей.</p> : null}
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button variant="outlined" className="flex items-center gap-2" onClick={() => addBlock3Question(block3Key)}>
                            <IoAddOutline size={16} /> Добавить
                        </Button>
                    </div>
                </section>
            );
        }

        if (!currentItem) {
            return (
                <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-3">
                    <h2 className="text-xl font-bold">Вопросы {BLOCK3_LABELS[block3Key]}</h2>
                    <p className="text-sm opacity-70">Запись не найдена.</p>
                </section>
            );
        }

        const isMultiAuthor = block3Key === 'task11_4';
        const typedItem = currentItem as Block3Question | Block3QuestionMultiAuthor;

        return (
            <section className="rounded-xl border border-[#221E20]/10 bg-white p-4 space-y-4">
                <h2 className="text-xl font-bold">Вопросы {BLOCK3_LABELS[block3Key]}</h2>

                <div className="rounded-lg border border-[#221E20]/10 p-3 space-y-3">
                    <div className="flex justify-end">
                        <Button
                            variant="outlined"
                            className="text-red-600 border-red-100"
                            onClick={() => {
                                if (!window.confirm('Удалить запись?')) return;
                                const nextBlock3 = {
                                    ...block3,
                                    [block3Key]: block3[block3Key].filter((_, itemIndex) => itemIndex !== selectedIndex!),
                                };
                                setBlock3(nextBlock3);
                                void persistKnowledgeBase({ works, poets, block3: nextBlock3 });
                                router.push(buildMaterialsHref('block3', block3Key));
                            }}
                        >
                            <IoTrashOutline size={14} />
                        </Button>
                    </div>

                    <RichTextField
                        label="Текст вопроса"
                        value={typedItem.text || ''}
                        onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, text: value }))}
                        minHeight={180}
                    />

                    <div className={DETAIL_META_GRID_CLASS}>
                        {'workId' in typedItem ? (
                            <TextField
                                compact
                                label="Идентификатор произведения"
                                value={typedItem.workId || ''}
                                onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, workId: value }))}
                            />
                        ) : null}

                        {'authorId' in typedItem ? (
                            <TextField
                                compact
                                label="Идентификатор автора"
                                value={typedItem.authorId || ''}
                                onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, authorId: value }))}
                            />
                        ) : null}
                        <StatusField
                            value={typedItem.isActive}
                            onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, isActive: value }))}
                        />

                        {isMultiAuthor ? (
                            <div className={DETAIL_FULL_WIDTH_CLASS}>
                                <label className="flex flex-col gap-1">
                                    <FieldLabel>Идентификаторы авторов (через запятую)</FieldLabel>
                                    <input
                                        key={`${typedItem.id}-${selectedIndex!}-author-ids`}
                                        defaultValue={(typedItem as Block3QuestionMultiAuthor).authorIds.join(', ')}
                                        onChange={(event) => {
                                            const authorIds = event.target.value
                                                .split(/[,\n;]+/u)
                                                .map((itemValue) => itemValue.trim())
                                                .filter(Boolean);
                                            updateItem(selectedIndex!, (entry) => ({ ...entry, authorIds }));
                                        }}
                                        className="h-[40px] rounded-lg border border-[#221E20]/15 bg-white px-3 text-sm outline-none focus:border-[#221E20]"
                                    />
                                </label>
                            </div>
                        ) : null}

                        <TextField
                            compact
                            label="Идентификатор термина"
                            value={typedItem.termId || ''}
                            onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, termId: value }))}
                        />
                        <TextField
                            compact
                            label="Внутр. идентификатор темы"
                            value={typedItem.themeInternalId || ''}
                            onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, themeInternalId: value }))}
                        />
                        <TextField
                            compact
                            label="Публичный идентификатор"
                            value={typedItem.publicId || ''}
                            onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, publicId: value }))}
                        />
                        <TextField
                            compact
                            label="Род"
                            value={(typedItem as { rodId?: string }).rodId || ''}
                            onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, rodId: value }))}
                        />
                        {'questionId' in typedItem ? (
                            <TextField
                                compact
                                label="Идентификатор вопроса"
                                value={typedItem.questionId || ''}
                                onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, questionId: value }))}
                            />
                        ) : null}

                        <TextField
                            compact
                            label="Теги"
                            value={typedItem.tags || ''}
                            onChange={(value) => updateItem(selectedIndex!, (entry) => ({ ...entry, tags: value }))}
                        />
                    </div>

                    {'special' in typedItem ? (
                        <Checkbox
                            checked={Boolean(typedItem.special)}
                            onChange={(event) => updateItem(selectedIndex!, (entry) => ({ ...entry, special: event.target.checked }))}
                            label="Спец. вопрос"
                        />
                    ) : null}
                </div>

            </section>
        );
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="rounded-xl border border-[#221E20]/10 bg-white p-8 text-sm opacity-70">
                    Загружаю базу заданий...
                </div>
            );
        }

        if (!section) return renderRoot();

        if (section === 'settings') {
            if (slug.length === 1) return renderSettingsPage();
            return <NotFoundPane title="Раздел оформления варианта не найден" onBack={() => router.push(buildMaterialsHref('settings'))} />;
        }

        if (section === 'works') {
            if (!workId) return renderWorksList();
            if (!rawWorkSubSection) return renderWorkDetail();
            if (!workSubSection) return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;

            if (workSubSection === 'excerpts') {
                if (!excerptId) {
                    if (slug.length > 3) return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
                    return renderExcerptsList();
                }

                if (slug.length === 4) return renderExcerptDetail();
                if (excerptNestedScope !== 'tasks') return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
                if (!excerptTaskKey) return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
                if (slug.length === 6) return renderExcerptDetail(excerptTaskKey);
                if (slug.length === 7) {
                    if (excerptQuestionIndex === undefined) return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
                    return renderExcerptDetail(excerptTaskKey, excerptQuestionIndex);
                }
                return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
            }

            if (workSubSection === 'common-questions') {
                if (slug.length === 3) return renderCommonQuestionsPage();
                if (!commonTaskKey) return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
                if (slug.length === 4) return renderCommonQuestionsPage(commonTaskKey);
                if (slug.length === 5) {
                    if (commonQuestionIndex === undefined) return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
                    return renderCommonQuestionsPage(commonTaskKey, commonQuestionIndex);
                }
                return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
            }

            if (workSubSection === 'characters') {
                if (slug.length === 3) return renderCharactersPage();
                if (slug.length === 4) {
                    if (charactersQuestionIndex === undefined) return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
                    return renderCharactersPage(charactersQuestionIndex);
                }
                return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
            }

            return <NotFoundPane title="Раздел произведений не найден" onBack={() => router.push(buildMaterialsHref('works'))} />;
        }

        if (section === 'poets') {
            if (!poetId) return renderPoetsList();
            if (!rawPoetSubSection) return renderPoetDetail();
            if (!poetSubSection) return <NotFoundPane title="Раздел поэтов не найден" onBack={() => router.push(buildMaterialsHref('poets'))} />;
            if (poetSubSection === 'poems') {
                if (!poemId) {
                    if (slug.length > 3) return <NotFoundPane title="Раздел поэтов не найден" onBack={() => router.push(buildMaterialsHref('poets'))} />;
                    return renderPoemsList();
                }

                if (slug.length === 4) return renderPoemDetail();
                if (poemNestedScope !== 'tasks') return <NotFoundPane title="Раздел поэтов не найден" onBack={() => router.push(buildMaterialsHref('poets'))} />;
                if (!poemTaskKey) return <NotFoundPane title="Раздел поэтов не найден" onBack={() => router.push(buildMaterialsHref('poets'))} />;
                if (slug.length === 6) return renderPoemDetail(poemTaskKey);
                if (slug.length === 7) {
                    if (poemQuestionIndex === undefined) return <NotFoundPane title="Раздел поэтов не найден" onBack={() => router.push(buildMaterialsHref('poets'))} />;
                    return renderPoemDetail(poemTaskKey, poemQuestionIndex);
                }
                return <NotFoundPane title="Раздел поэтов не найден" onBack={() => router.push(buildMaterialsHref('poets'))} />;
            }

            return <NotFoundPane title="Раздел поэтов не найден" onBack={() => router.push(buildMaterialsHref('poets'))} />;
        }

        if (section === 'block3') {
            if (!block3Key) return renderBlock3Root();
            if (slug.length === 2) return renderBlock3Group();
            if (slug.length === 3) {
                if (block3QuestionIndex === undefined) return <NotFoundPane title="Группа блока 3 не найдена" onBack={() => router.push(buildMaterialsHref('block3'))} />;
                return renderBlock3Group(block3QuestionIndex);
            }
            return <NotFoundPane title="Группа блока 3 не найдена" onBack={() => router.push(buildMaterialsHref('block3'))} />;
        }

        return <NotFoundPane title="Страница не найдена" onBack={() => router.push(buildMaterialsHref())} />;
    };

    return (
        <AdminLayout>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="h-9 w-9 rounded-lg border border-[#221E20]/15 flex items-center justify-center hover:bg-black/5"
                        aria-label="Назад"
                    >
                        <IoArrowBackOutline size={18} />
                    </button>
                    <h1 className="text-2xl font-bold">База заданий</h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outlined" onClick={() => void loadKnowledgeBase()} disabled={isLoading || isSaving}>
                        {isLoading ? 'Загружаю...' : 'Обновить из БД'}
                    </Button>
                    <Button variant="outlined" className="bg-black/5" onClick={() => void saveKnowledgeBase()} disabled={isLoading || isSaving}>
                        {isSaving ? 'Сохраняю...' : 'Сохранить в БД'}
                    </Button>
                </div>
            </div>

            {status ? (
                <div className="mb-4 rounded-lg border border-[#221E20]/10 bg-white px-3 py-2 text-sm">
                    {status}
                </div>
            ) : null}

            <BreadcrumbsNav items={breadcrumbs} />

            <div className={isLoading ? 'opacity-60 pointer-events-none' : ''}>
                {renderContent()}
            </div>
        </AdminLayout>
    );
}
