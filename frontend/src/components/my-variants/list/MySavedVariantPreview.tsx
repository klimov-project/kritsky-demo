'use client';

import { useState } from 'react';
import Link from 'next/link';

import Button from '@/components/shared/Button';
import type { MySavedVariantPreviewProps } from '@/types/ui/myVariants';
import {
    formatMyVariantsDate,
    getMyVariantsTask2RightOptions,
    MY_VARIANTS_RUSSIAN_LETTERS,
    MY_VARIANTS_TASK8_MAX_OPTIONS,
} from '@/utils/myVariants';
import MyVariantsRichTextBlock from '@/components/my-variants/list/MyVariantsRichTextBlock';

export default function MySavedVariantPreview({ saved, onDelete }: MySavedVariantPreviewProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { variant } = saved;

    const handleDelete = async () => {
        if (!confirm('Вы уверены, что хотите удалить этот вариант?')) return;

        setIsDeleting(true);
        const isDeleted = await onDelete(saved.id);
        if (!isDeleted) {
            alert('Не удалось удалить вариант');
        }
        setIsDeleting(false);
    };

    return (
        <div className="bg-white border border-[#221E20]/10 rounded-xl font-serif">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#221E20]/10">
                <div className="flex items-center gap-4">
                    <h2 className="font-bold text-lg">Вариант #{String(saved.id)}</h2>
                    <span className="text-xs opacity-60">{formatMyVariantsDate(saved.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/my-variants/${saved.id}`}>
                        <Button variant="outlined" size="small">Открыть отдельно</Button>
                    </Link>
                    <Button
                        variant="outlined"
                        size="small"
                        className="!text-red-500 !border-red-200 hover:!bg-red-50"
                        disabled={isDeleting}
                        onClick={handleDelete}
                    >
                        Удалить
                    </Button>
                </div>
            </div>

            <div className="px-6 py-6 space-y-6 text-sm">
                <div className="space-y-3">
                    <div className="text-center text-xs uppercase font-bold opacity-60">Часть 1</div>

                    <MyVariantsRichTextBlock
                        value={variant.excerpt.text}
                        fallback="Текст отрывка отсутствует."
                        className="rich-content text-sm leading-relaxed"
                    />
                    <div className="text-right text-sm italic opacity-70">{variant.work.author} — {variant.work.title}</div>

                    <div className="space-y-3">
                        <div>
                            <span className="font-bold">1.</span>{' '}
                            <MyVariantsRichTextBlock value={variant.task1?.text} fallback="Вопрос не задан" as="span" className="rich-content" />
                        </div>

                        {variant.task2 && (
                            <div className="space-y-2">
                                <div>
                                    <span className="font-bold">2.</span>{' '}
                                    <MyVariantsRichTextBlock value={variant.task2?.prompt} fallback="Вопрос не задан" as="span" className="rich-content" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pl-4">
                                    <div>
                                        <div className="font-bold uppercase text-[10px] mb-1">{variant.task2?.leftLabel || 'Левый столбик'}</div>
                                        {(variant.task2?.pairs || []).map((pair, index) => (
                                            <div key={pair.id}>{MY_VARIANTS_RUSSIAN_LETTERS[index] || `${index + 1}`}. {pair.character}</div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="font-bold uppercase text-[10px] mb-1">{variant.task2?.rightLabel || 'Правый столбик'}</div>
                                        {getMyVariantsTask2RightOptions(variant.task2).map((option, index) => (
                                            <div key={`${option}-${index}`}>{index + 1}. {option}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <span className="font-bold">3.</span> Заполните пропуски в предложениях.
                            <div className="pl-4">
                                <MyVariantsRichTextBlock value={variant.task3?.part1} fallback="—" as="span" className="rich-content" />{' '}
                                <MyVariantsRichTextBlock value={variant.task3?.part2} fallback="—" as="span" className="rich-content" />
                            </div>
                        </div>

                        <div><span className="font-bold">4.1</span> <MyVariantsRichTextBlock value={variant.task4_1?.text} fallback="Вопрос не задан" className="rich-content pl-4" /></div>
                        <div><span className="font-bold">4.2</span> <MyVariantsRichTextBlock value={variant.task4_2?.text} fallback="Вопрос не задан" className="rich-content pl-4" /></div>
                        <div><span className="font-bold">5.</span> <MyVariantsRichTextBlock value={variant.task5?.text} fallback="Вопрос не задан" className="rich-content pl-4" /></div>
                    </div>
                </div>

                <hr className="border-[#221E20]/10" />

                <div className="space-y-3">
                    <div className="text-center text-xs uppercase font-bold opacity-60">Часть 2</div>

                    <div className="text-center font-bold uppercase text-sm">{variant.poem.title}</div>
                    <MyVariantsRichTextBlock
                        value={variant.poem.text}
                        fallback="Текст стихотворения отсутствует."
                        className="rich-content text-sm leading-relaxed text-center"
                    />

                    <div className="space-y-3">
                        <div>
                            <span className="font-bold">6.</span>{' '}
                            <MyVariantsRichTextBlock value={variant.task6?.part1} fallback="—" as="span" className="rich-content" />{' '}
                            <MyVariantsRichTextBlock value={variant.task6?.part2} fallback="" as="span" className="rich-content" />
                        </div>
                        <div><span className="font-bold">7.</span> <MyVariantsRichTextBlock value={variant.task7?.text} fallback="Вопрос не задан" className="rich-content" /></div>
                        <div className="space-y-1">
                            <div><span className="font-bold">8.</span> <MyVariantsRichTextBlock value={variant.task8?.prompt} fallback="Вопрос не задан" as="span" className="rich-content" /></div>
                            <div className="pl-4">
                                {variant.task8Options.slice(0, MY_VARIANTS_TASK8_MAX_OPTIONS).map((option, index) => (
                                    <div key={`${option.id}-${index}`}>{index + 1}. {option.term}</div>
                                ))}
                            </div>
                        </div>
                        <div><span className="font-bold">9.1</span> <MyVariantsRichTextBlock value={variant.task9_1?.text} fallback="Вопрос не задан" className="rich-content pl-4" /></div>
                        <div><span className="font-bold">9.2</span> <MyVariantsRichTextBlock value={variant.task9_2?.text} fallback="Вопрос не задан" className="rich-content pl-4" /></div>
                        <div><span className="font-bold">10.</span> <MyVariantsRichTextBlock value={variant.task10?.text} fallback="Вопрос не задан" className="rich-content pl-4" /></div>
                    </div>
                </div>

                <hr className="border-[#221E20]/10" />

                <div className="space-y-3">
                    <div className="text-center text-xs uppercase font-bold opacity-60">Часть 3</div>
                    <div className="space-y-2">
                        <div><span className="font-bold">11.1</span> <MyVariantsRichTextBlock value={variant.task11_1?.text} fallback="Вопрос не задан" className="rich-content pl-4" /></div>
                        <div><span className="font-bold">11.2</span> <MyVariantsRichTextBlock value={variant.task11_2?.text} fallback="Вопрос не задан" className="rich-content pl-4" /></div>
                        <div><span className="font-bold">11.3</span> <MyVariantsRichTextBlock value={variant.task11_3?.text} fallback="Вопрос не задан" className="rich-content pl-4" /></div>
                        <div><span className="font-bold">11.4</span> <MyVariantsRichTextBlock value={variant.task11_4?.text} fallback="Вопрос не задан" className="rich-content pl-4" /></div>
                        <div><span className="font-bold">11.5</span> <MyVariantsRichTextBlock value={variant.task11_5?.text} fallback="Вопрос не задан" className="rich-content pl-4" /></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
