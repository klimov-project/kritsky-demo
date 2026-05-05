'use client';

import Link from 'next/link';

import Button from '@/components/shared/Button';
import MyVariantDetailsRichTextBlock from '@/components/my-variants/details/MyVariantDetailsRichTextBlock';
import type { MyVariantDetailsContentProps } from '@/types/ui/myVariantDetails';
import {
    formatMyVariantDate,
    getMyVariantTask2RightOptions,
    getTask1FiltersLabel,
    getVariantQuotaCaption,
    MY_VARIANT_DETAILS_RUSSIAN_LETTERS,
    MY_VARIANT_DETAILS_TASK8_MAX_OPTIONS,
} from '@/utils/myVariantDetails';

export default function MyVariantDetailsContent({
    savedVariant,
    exportQuota,
    onPrint,
    onDownload,
}: MyVariantDetailsContentProps) {
    const { variant, settings } = savedVariant;

    return (
        <div className="print-area variant-uniform w-full max-w-[980px] mx-auto px-4 md:px-0 pt-[90px] pb-20 font-serif space-y-8">
            <Link href="/my-variants" className="no-print text-sm text-[#221E20]/60 hover:text-[#221E20] transition-colors">
                ← Назад к списку вариантов
            </Link>

            <div className="text-center space-y-1">
                <h1 className="text-lg font-bold uppercase tracking-widest">Сохранённый вариант</h1>
                <p className="text-xs uppercase opacity-60">{formatMyVariantDate(savedVariant.createdAt)}</p>
            </div>

            <div className="no-print flex flex-wrap justify-center gap-3">
                <Button variant="outlined" onClick={onPrint}>
                    Распечатать
                </Button>
                <Button variant="outlined" onClick={onDownload}>
                    Скачать
                </Button>
            </div>
            {exportQuota ? (
                <div className="no-print text-center text-xs opacity-60">
                    {getVariantQuotaCaption(exportQuota)}
                </div>
            ) : null}

            <div className="space-y-3">
                <div className="text-center space-y-1">
                    <p className="text-sm uppercase">Часть 1</p>
                </div>
                <div className="border border-gray-400 px-4 py-3 text-center text-sm leading-relaxed">
                    Прочитайте приведённый ниже фрагмент художественного произведения и выполните задания 1–3, 4.1 или 4.2
                    (на выбор) и задание 5.
                </div>
                <div className="border border-gray-200 rounded-xl p-3 text-xs space-y-1">
                    <div>Произведение: {settings.selectedWorkLabel || `${variant.work.author} — ${variant.work.title}`}</div>
                    <div>Отрывок: {settings.selectedExcerptLabel || variant.excerpt.title}</div>
                    <div>Фильтры задания 1: {getTask1FiltersLabel(settings.task1Filters)}</div>
                </div>
                <MyVariantDetailsRichTextBlock
                    value={variant.excerpt.text}
                    fallback="Текст отрывка отсутствует."
                    className="rich-content text-sm leading-relaxed"
                />
                <div className="text-right text-sm italic">{variant.work.author} — {variant.work.title}</div>
                <div className="space-y-4 text-sm">
                    <div>
                        1. <MyVariantDetailsRichTextBlock value={variant.task1?.text} fallback="Вопрос не задан" as="span" />
                    </div>
                    <div className="opacity-60">Ответ: ____________________</div>

                    <div className="space-y-2">
                        <div>
                            2. <MyVariantDetailsRichTextBlock value={variant.task2?.prompt} fallback="Вопрос не задан" as="span" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="font-bold uppercase text-[10px] mb-1">{variant.task2?.leftLabel || 'Левый столбик'}</div>
                                <div className="space-y-1">
                                    {(variant.task2?.pairs || []).map((pair, index) => (
                                        <div key={pair.id}>
                                            {MY_VARIANT_DETAILS_RUSSIAN_LETTERS[index] || `${index + 1}`}. {pair.character}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="font-bold uppercase text-[10px] mb-1">{variant.task2?.rightLabel || 'Правый столбик'}</div>
                                <div className="space-y-1">
                                    {getMyVariantTask2RightOptions(variant.task2).map((option, index) => (
                                        <div key={`${option}-${index}`}>
                                            {index + 1}. {option}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="opacity-60">Ответ: ____________________</div>
                    </div>

                    <div className="space-y-1">
                        <div>3. Заполните пропуски в предложениях.</div>
                        <div>
                            <MyVariantDetailsRichTextBlock value={variant.task3?.part1} fallback="—" as="span" />{' '}
                            <MyVariantDetailsRichTextBlock value={variant.task3?.part2} fallback="—" as="span" />
                        </div>
                        <div className="opacity-60">Ответ: ____________________</div>
                    </div>

                    <div className="space-y-1">
                        <div>4.1</div>
                        <MyVariantDetailsRichTextBlock
                            value={variant.task4_1?.text}
                            fallback="Вопрос 4.1 не задан"
                            className="rich-content text-sm leading-relaxed"
                        />
                    </div>
                    <div className="space-y-1">
                        <div>4.2</div>
                        <MyVariantDetailsRichTextBlock
                            value={variant.task4_2?.text}
                            fallback="Вопрос 4.2 не задан"
                            className="rich-content text-sm leading-relaxed"
                        />
                    </div>
                    <div className="space-y-1">
                        <div>5.</div>
                        <MyVariantDetailsRichTextBlock
                            value={variant.task5?.text}
                            fallback="Вопрос 5 не задан"
                            className="rich-content text-sm leading-relaxed"
                        />
                    </div>
                </div>
            </div>

            <section className="print-part-break space-y-3">
                <div className="text-center text-sm uppercase">Часть 2</div>
                <div className="border border-gray-400 px-4 py-3 text-center text-sm leading-relaxed">
                    Прочитайте приведённое ниже стихотворение и выполните задания 6–8, 9.1 или 9.2 (на выбор) и задание 10.
                </div>
                <div className="border border-gray-200 rounded-xl p-3 text-xs space-y-1">
                    <div>Автор: {settings.selectedPoetLabel || variant.poet.name}</div>
                    <div>Стихотворение: {settings.selectedPoemLabel || variant.poem.title}</div>
                    <div>Тема задания 10: {settings.selectedThemeId || 'не выбрана'}</div>
                </div>
                <div className="space-y-2">
                    <div className="text-center font-bold uppercase">{variant.poem.title}</div>
                    <MyVariantDetailsRichTextBlock
                        value={variant.poem.text}
                        fallback="Текст стихотворения отсутствует."
                        className="rich-content text-sm leading-relaxed text-center"
                    />
                </div>
                <div className="space-y-3 text-sm">
                    <div className="space-y-1">
                        <div>
                            6. <MyVariantDetailsRichTextBlock value={variant.task6?.part1} fallback="—" as="span" />{' '}
                            <MyVariantDetailsRichTextBlock value={variant.task6?.part2} fallback="" as="span" />
                        </div>
                        <div className="opacity-60">Ответ: ____________________</div>
                    </div>
                    <div className="space-y-1">
                        <div>7.</div>
                        <MyVariantDetailsRichTextBlock
                            value={variant.task7?.text}
                            fallback="Вопрос 7 не задан"
                            className="rich-content text-sm leading-relaxed"
                        />
                        <div className="opacity-60">Ответ: ____________________</div>
                    </div>
                    <div className="space-y-1">
                        <div>8.</div>
                        <MyVariantDetailsRichTextBlock
                            value={variant.task8?.prompt}
                            fallback="Вопрос 8 не задан"
                            className="rich-content text-sm leading-relaxed"
                        />
                        {variant.task8Options.slice(0, MY_VARIANT_DETAILS_TASK8_MAX_OPTIONS).map((option, index) => (
                            <div key={`${option.id}-${index}`}>
                                {index + 1}. {option.term}
                            </div>
                        ))}
                        <div className="opacity-60">Ответ: ____________________</div>
                    </div>
                    <div className="space-y-1">
                        <div>9.1</div>
                        <MyVariantDetailsRichTextBlock
                            value={variant.task9_1?.text}
                            fallback="Вопрос 9.1 не задан"
                            className="rich-content text-sm leading-relaxed"
                        />
                    </div>
                    <div className="space-y-1">
                        <div>9.2</div>
                        <MyVariantDetailsRichTextBlock
                            value={variant.task9_2?.text}
                            fallback="Вопрос 9.2 не задан"
                            className="rich-content text-sm leading-relaxed"
                        />
                    </div>
                    <div className="space-y-1">
                        <div>10.</div>
                        <MyVariantDetailsRichTextBlock
                            value={variant.task10?.text}
                            fallback="Вопрос 10 не задан"
                            className="rich-content text-sm leading-relaxed"
                        />
                    </div>
                </div>
            </section>

            <section className="print-part-break space-y-3">
                <div className="text-center text-sm uppercase">Часть 3</div>
                <div className="border border-gray-400 px-4 py-3 text-center text-sm">
                    Выберите одну из пяти тем сочинений (11.1–11.5) и напишите развёрнутый ответ.
                </div>
                <div className="border border-gray-200 rounded-xl p-3 text-xs space-y-1">
                    <div>Автор задания 11: {settings.selectedBlock3AuthorLabel || 'не выбран'}</div>
                </div>
                <div className="space-y-3 text-sm">
                    <div className="space-y-1">
                        <div className="font-bold">11.1</div>
                        <MyVariantDetailsRichTextBlock value={variant.task11_1?.text} fallback="Вопрос 11.1 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold">11.2</div>
                        <MyVariantDetailsRichTextBlock value={variant.task11_2?.text} fallback="Вопрос 11.2 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold">11.3</div>
                        <MyVariantDetailsRichTextBlock value={variant.task11_3?.text} fallback="Вопрос 11.3 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold">11.4</div>
                        <MyVariantDetailsRichTextBlock value={variant.task11_4?.text} fallback="Вопрос 11.4 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold">11.5</div>
                        <MyVariantDetailsRichTextBlock value={variant.task11_5?.text} fallback="Вопрос 11.5 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                </div>
            </section>
        </div>
    );
}
