'use client';

import CollapsibleInstruction from '@/components/author-variant/CollapsibleInstruction';
import RichTextBlock from '@/components/author-variant/RichTextBlock';
import type { AuthorVariantContentProps } from '@/types/ui/authorVariant';
import {
    AUTHOR_VARIANT_RUSSIAN_LETTERS,
    getTask2RightOptions,
    getTask8AnswerLabel,
} from '@/utils/authorVariant';

export default function AuthorVariantContent({ variant, settings, showAnswers }: AuthorVariantContentProps) {
    return (
        <div className="space-y-8">
            <div className="text-center space-y-3">
                <h1 className="text-[36px] font-bold uppercase tracking-[0.08em] leading-none">ВАРИАНТ НЕДЕЛИ</h1>
                <div className="new-test-title-lines mx-auto flex flex-col items-center gap-1" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </div>
                <p className="text-[26px] font-bold leading-none">Часть 1</p>
            </div>

            <CollapsibleInstruction value={settings.variantTexts.part1Intro} fallback="Инструкция к первой части не задана." />

            <div className="space-y-3">
                <RichTextBlock value={variant.excerpt.text} fallback="Текст отрывка отсутствует." className="rich-content text-sm leading-relaxed" />
                <div className="text-right text-sm italic">{variant.work.author} — {variant.work.title}</div>
            </div>

            <div className="space-y-[30px]">
                <div className="variant-copy text-sm space-y-2">
                    <div className="font-bold">
                        1. <RichTextBlock value={variant.task1?.text} fallback="Вопрос не задан" as="span" />
                    </div>
                    <div className="opacity-60 mt-4">Ответ: ____________________</div>
                    {showAnswers && <div className="text-xs opacity-80">Ответ: {variant.task1?.answer || '—'}</div>}
                </div>

                <div className="variant-copy text-sm space-y-2">
                    <div className="font-bold">
                        2. <RichTextBlock value={variant.task2?.prompt} fallback="Вопрос не задан" as="span" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2 text-left">
                        <div>
                            <div className="mb-1 font-bold uppercase text-[10px]">{variant.task2?.leftLabel || 'Левый столбик'}</div>
                            <div className="space-y-1">
                                {(variant.task2?.pairs || []).map((pair, index) => (
                                    <div key={pair.id} style={{ paddingLeft: '1.2em', textIndent: '-1.2em' }}>
                                        {AUTHOR_VARIANT_RUSSIAN_LETTERS[index] || `${index + 1}`}){' '}
                                        <RichTextBlock value={pair.character} fallback="" as="span" className="rich-content" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div className="mb-1 font-bold uppercase text-[10px]">{variant.task2?.rightLabel || 'Правый столбик'}</div>
                            <div className="space-y-1">
                                {getTask2RightOptions(variant.task2).map((option, index) => (
                                    <div key={`${option}-${index}`} style={{ paddingLeft: '1.2em', textIndent: '-1.2em' }}>
                                        {index + 1}){' '}
                                        <RichTextBlock value={option} fallback="" as="span" className="rich-content" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="opacity-60 mt-4">Ответ: __________________________________________________________________</div>
                </div>

                <div className="variant-copy text-sm space-y-2">
                    <div className="font-bold">3. Заполните пропуски в предложениях.</div>
                    <div>
                        <RichTextBlock value={variant.task3?.part1} fallback="—" as="span" />{' '}
                        <RichTextBlock value={variant.task3?.part2} fallback="—" as="span" />
                    </div>
                    <div className="opacity-60 mt-4">Ответ: ____________________</div>
                    {showAnswers && <div className="text-xs opacity-80">Ответ: {variant.task3?.answer1 || '—'} / {variant.task3?.answer2 || '—'}</div>}
                </div>
            </div>

            <CollapsibleInstruction value={settings.variantTexts.part1Criteria} fallback="Критерии к первой части не заданы." />

            <div className="space-y-3 variant-copy text-sm">
                <div className="space-y-1">
                    <div>4.1</div>
                    <RichTextBlock value={variant.task4_1?.text} fallback="Вопрос 4.1 не задан" className="rich-content text-sm leading-relaxed" />
                </div>
                <div className="space-y-1">
                    <div>4.2</div>
                    <RichTextBlock value={variant.task4_2?.text} fallback="Вопрос 4.2 не задан" className="rich-content text-sm leading-relaxed" />
                </div>
                <div className="space-y-1">
                    <div>5.</div>
                    <RichTextBlock value={variant.task5?.text} fallback="Вопрос 5 не задан" className="rich-content text-sm leading-relaxed" />
                </div>
            </div>

            <section className="print-part-break space-y-4">
                <div className="text-center text-sm uppercase">Часть 2</div>
                <CollapsibleInstruction value={settings.variantTexts.part2Intro} fallback="Инструкция ко второй части не задана." />
                <div className="space-y-2">
                    <div className="text-center font-bold uppercase">{variant.poem.title}</div>
                    <RichTextBlock value={variant.poem.text} fallback="Текст стихотворения отсутствует." className="rich-content text-center text-sm leading-relaxed" />
                </div>
                <div className="space-y-3 variant-copy text-sm">
                    <div className="space-y-1">
                        <div className="font-bold">6.</div>
                        <div>
                            <RichTextBlock value={variant.task6?.part1} fallback="—" as="span" />{' '}
                            <RichTextBlock value={variant.task6?.part2} fallback="—" as="span" />
                        </div>
                        <div className="opacity-60 mt-4">Ответ: ____________________</div>
                    </div>
                    <div className="space-y-1">
                        <div>7.</div>
                        <RichTextBlock value={variant.task7?.text} fallback="Вопрос 7 не задан" className="rich-content text-sm leading-relaxed" />
                        <div className="opacity-60 mt-4">Ответ: ____________________</div>
                    </div>
                    <div className="space-y-1">
                        <div>8.</div>
                        <RichTextBlock value={variant.task8?.prompt} fallback="Вопрос 8 не задан" className="rich-content text-sm leading-relaxed" />
                        {variant.task8Options.map((option, index) => (
                            <div key={`${option.id}-${index}`}>{index + 1}. {option.term}</div>
                        ))}
                        <div className="opacity-60 mt-4">Ответ: ____________________</div>
                        {showAnswers && (
                            <div className="text-xs opacity-80">
                                Ответ: {getTask8AnswerLabel(variant)}
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <div>9.1</div>
                        <RichTextBlock value={variant.task9_1?.text} fallback="Вопрос 9.1 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                        <div>9.2</div>
                        <RichTextBlock value={variant.task9_2?.text} fallback="Вопрос 9.2 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                        <div>10.</div>
                        <RichTextBlock value={variant.task10?.text} fallback="Вопрос 10 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                </div>
            </section>

            <section className="print-part-break space-y-4">
                <div className="text-center text-sm uppercase">Часть 3</div>
                <CollapsibleInstruction value={settings.variantTexts.part3Intro} fallback="Инструкция к третьей части не задана." />
                <div className="space-y-3 variant-copy text-sm">
                    <div className="space-y-1">
                        <div className="font-bold">11.1</div>
                        <RichTextBlock value={variant.task11_1?.text} fallback="Вопрос 11.1 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold">11.2</div>
                        <RichTextBlock value={variant.task11_2?.text} fallback="Вопрос 11.2 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold">11.3</div>
                        <RichTextBlock value={variant.task11_3?.text} fallback="Вопрос 11.3 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold">11.4</div>
                        <RichTextBlock value={variant.task11_4?.text} fallback="Вопрос 11.4 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold">11.5</div>
                        <RichTextBlock value={variant.task11_5?.text} fallback="Вопрос 11.5 не задан" className="rich-content text-sm leading-relaxed" />
                    </div>
                </div>
            </section>
        </div>
    );
}
