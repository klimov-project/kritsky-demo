'use client';

import Button from '@/components/shared/Button';
import type { MyBookGeneratedVariantCardProps } from '@/types/ui/myBookDetails';

export default function MyBookGeneratedVariantCard({
    variant,
    isAnswerRevealed,
    onToggleAnswers,
    excerptHtml,
}: MyBookGeneratedVariantCardProps) {
    return (
        <article className="rounded-xl border border-[#221E20]/10 bg-[#fffdf8] p-5 space-y-5">
            <div className="space-y-2">
                <div className="font-serif text-xl font-bold text-[#221E20]">
                    Вариант {variant.index}
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-[#221E20]/60">
                        {variant.author} • {variant.workTitle} • {variant.excerptTitle}
                    </div>
                    <Button
                        variant="outlined"
                        className="no-print px-4 py-2 text-sm"
                        onClick={() => onToggleAnswers(variant.id)}
                    >
                        {isAnswerRevealed ? 'Скрыть ответы' : 'Показать ответы'}
                    </Button>
                </div>
            </div>

            <div
                className="border border-[#221E20]/10 rounded-xl p-4 leading-relaxed text-justify [&_p]:mb-3 [&_p:last-child]:mb-0 [&_b]:font-semibold [&_i]:italic"
                dangerouslySetInnerHTML={{ __html: excerptHtml }}
            />

            {variant.task1 ? (
                <div className="space-y-1">
                    <div className="font-bold text-sm">1. {variant.task1.prompt}</div>
                    {isAnswerRevealed ? (
                        <div className="text-sm text-[#221E20]/60">Ответ: {variant.task1.answer || '—'}</div>
                    ) : null}
                </div>
            ) : (
                <div className="space-y-1">
                    <div className="font-bold text-sm">1. Задание отсутствует.</div>
                </div>
            )}

            {variant.task2 ? (
                <div className="space-y-3">
                    <div className="font-bold text-sm">2. {variant.task2.prompt}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="rounded-xl border border-[#221E20]/10 p-4">
                            <div className="font-bold mb-2">{variant.task2.leftLabel}</div>
                            {variant.task2.pairs.map((pair, index) => (
                                <div key={`${pair.character}-${index}`}>{String.fromCharCode(1040 + index)}. {pair.character}</div>
                            ))}
                        </div>
                        <div className="rounded-xl border border-[#221E20]/10 p-4">
                            <div className="font-bold mb-2">{variant.task2.rightLabel}</div>
                            {variant.task2.rightOptions.map((option, index) => (
                                <div key={`${option}-${index}`}>{index + 1}. {option}</div>
                            ))}
                        </div>
                    </div>
                    {isAnswerRevealed ? (
                        <div className="text-sm text-[#221E20]/60">Ответ: {variant.task2.answer}</div>
                    ) : null}
                </div>
            ) : (
                <div className="space-y-1">
                    <div className="font-bold text-sm">2. Задание отсутствует.</div>
                </div>
            )}

            {variant.task3 ? (
                <div className="space-y-1">
                    <div className="font-bold text-sm">3. Заполните пропуски в предложениях.</div>
                    <div className="text-sm leading-relaxed text-justify">
                        {variant.task3.part1} {variant.task3.part2}
                    </div>
                    {isAnswerRevealed ? (
                        <div className="text-sm text-[#221E20]/60">
                            Ответ: {variant.task3.answer1 || '—'} / {variant.task3.answer2 || '—'}
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="space-y-1">
                    <div className="font-bold text-sm">3. Задание отсутствует.</div>
                </div>
            )}

            {variant.task4_1 || variant.task4_2 ? (
                <>
                    {variant.task4_1 ? (
                        <div className="space-y-1">
                            <div className="font-bold text-sm">4.1</div>
                            <div className="text-sm leading-relaxed text-justify">{variant.task4_1.prompt}</div>
                        </div>
                    ) : null}

                    {variant.task4_2 ? (
                        <div className="space-y-1">
                            <div className="font-bold text-sm">4.2</div>
                            <div className="text-sm leading-relaxed text-justify">{variant.task4_2.prompt}</div>
                        </div>
                    ) : null}
                </>
            ) : (
                <div className="space-y-1">
                    <div className="font-bold text-sm">4. Задание отсутствует.</div>
                </div>
            )}

            {variant.task5 ? (
                <div className="space-y-1">
                    <div className="font-bold text-sm">5.</div>
                    <div className="text-sm leading-relaxed text-justify">{variant.task5.prompt}</div>
                </div>
            ) : (
                <div className="space-y-1">
                    <div className="font-bold text-sm">5. Задание отсутствует.</div>
                </div>
            )}
        </article>
    );
}
