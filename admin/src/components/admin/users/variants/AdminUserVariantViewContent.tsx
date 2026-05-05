'use client';

import Link from 'next/link';
import Button from '@/components/shared/Button';
import type { AdminUserVariantPartThreeTask, AdminUserVariantRichTextProps, AdminUserVariantTaskIdBadgeProps, AdminUserVariantViewContentProps } from '@/types/ui/adminUserVariant';
import {
    ADMIN_USER_VARIANT_RUSSIAN_LETTERS,
    ADMIN_USER_VARIANT_TASK8_MAX_OPTIONS,
    formatAdminUserVariantDate,
    getRodLabel,
    getTask2RightOptions,
    getTaskTagsList,
    hasHtmlMarkup,
} from '@/utils/adminUserVariant';

function RichTextBlock({
    value,
    fallback,
    className,
    as: Component = 'div',
}: AdminUserVariantRichTextProps) {
    const normalized = (value || '').trim();
    const plainClassName = [className, 'whitespace-pre-line'].filter(Boolean).join(' ');
    if (!normalized) {
        return <Component className={plainClassName}>{fallback}</Component>;
    }
    if (hasHtmlMarkup(normalized)) {
        return <Component className={className} dangerouslySetInnerHTML={{ __html: normalized }} />;
    }
    return <Component className={plainClassName}>{normalized}</Component>;
}

function TaskIdBadge({ id, extra }: AdminUserVariantTaskIdBadgeProps) {
    const parts: string[] = [];
    if (id) parts.push(`#${id}`);
    if (extra) parts.push(extra);
    if (parts.length === 0) return null;
    return (
        <span className="ml-2 text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
            {parts.join(' ')}
        </span>
    );
}

export default function AdminUserVariantViewContent({ savedVariant, onBack }: AdminUserVariantViewContentProps) {
    const { variant } = savedVariant;

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <Button variant="outlined" className="!text-sm" onClick={onBack}>
                    &larr; Назад
                </Button>
                <div className="flex items-center gap-4">
                    <span className="text-sm opacity-60">
                        Вариант #{savedVariant.id} | Пользователь #{savedVariant.userId} | {formatAdminUserVariantDate(savedVariant.createdAt)}
                    </span>
                    <Link href={`/my-variants/${savedVariant.id}`} target="_blank">
                        <Button variant="outlined" className="!text-sm">
                            Открыть как пользователь
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm font-serif space-y-8">
                {/* Part 1 */}
                <div className="space-y-4">
                    <div className="text-center text-xs uppercase font-bold opacity-60">Часть 1</div>

                    <div className="text-xs text-gray-500 mb-2">
                        Произведение: {variant.work.author} — {variant.work.title}
                        <TaskIdBadge id={variant.work.id} extra={variant.work.authorId ? `author:${variant.work.authorId}` : undefined} />
                        {' | '}Отрывок<TaskIdBadge id={variant.excerpt.id} />
                        {(variant.excerpt as any)?.themeInternalId && (
                            <span className="ml-1 text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-sans">
                                тема: {(variant.excerpt as any).themeInternalId}
                            </span>
                        )}
                    </div>

                    <RichTextBlock
                        value={variant.excerpt.text}
                        fallback="Текст отрывка отсутствует."
                        className="rich-content text-sm leading-relaxed"
                    />
                    <div className="text-right text-sm italic opacity-70">
                        {variant.work.author} — {variant.work.title}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <span className="font-bold">1.</span>{' '}
                            <RichTextBlock value={variant.task1?.text} fallback="Вопрос не задан" as="span" className="rich-content" />
                            <TaskIdBadge id={variant.task1?.id} />
                        </div>

                        {variant.task2 && (
                            <div className="space-y-2">
                                <div>
                                    <span className="font-bold">2.</span>{' '}
                                    <RichTextBlock value={variant.task2?.prompt} fallback="Вопрос не задан" as="span" className="rich-content" />
                                    <TaskIdBadge id={variant.task2?.id} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pl-4">
                                    <div>
                                        <div className="font-bold uppercase text-[10px] mb-1">{variant.task2?.leftLabel || 'Левый столбик'}</div>
                                        {(variant.task2?.pairs || []).map((pair, i) => (
                                            <div key={pair.id}>{ADMIN_USER_VARIANT_RUSSIAN_LETTERS[i] || `${i + 1}`}. {pair.character}</div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="font-bold uppercase text-[10px] mb-1">{variant.task2?.rightLabel || 'Правый столбик'}</div>
                                        {getTask2RightOptions(variant.task2).map((opt, i) => (
                                            <div key={`${opt}-${i}`}>{i + 1}. {opt}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <span className="font-bold">3.</span> Заполните пропуски в предложениях.
                            <TaskIdBadge id={variant.task3?.id} />
                            <div className="pl-4">
                                <RichTextBlock value={variant.task3?.part1} fallback="—" as="span" className="rich-content" />{' '}
                                <RichTextBlock value={variant.task3?.part2} fallback="—" as="span" className="rich-content" />
                            </div>
                        </div>

                        <div>
                            <span className="font-bold">4.1</span>{' '}
                            <RichTextBlock value={variant.task4_1?.text} fallback="Вопрос не задан" className="rich-content pl-4 inline" />
                            <TaskIdBadge id={variant.task4_1?.id} />
                            {getTaskTagsList(variant.task4_1).length > 0 && (
                                <div className="pl-8 mt-0.5 flex flex-wrap gap-1">
                                    {getTaskTagsList(variant.task4_1).map((tag, i) => (
                                        <span key={`${tag}-${i}`} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-sans">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <span className="font-bold">4.2</span>{' '}
                            <RichTextBlock value={variant.task4_2?.text} fallback="Вопрос не задан" className="rich-content pl-4 inline" />
                            <TaskIdBadge id={variant.task4_2?.id} />
                            {getTaskTagsList(variant.task4_2).length > 0 && (
                                <div className="pl-8 mt-0.5 flex flex-wrap gap-1">
                                    {getTaskTagsList(variant.task4_2).map((tag, i) => (
                                        <span key={`${tag}-${i}`} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-sans">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <span className="font-bold">5.</span>{' '}
                            <RichTextBlock value={variant.task5?.text} fallback="Вопрос не задан" className="rich-content pl-4 inline" />
                            <TaskIdBadge id={variant.task5?.id} extra={variant.task5?.authorId ? `author:${variant.task5.authorId}` : undefined} />
                            {getTaskTagsList(variant.task5).length > 0 && (
                                <div className="pl-8 mt-0.5 flex flex-wrap gap-1">
                                    {getTaskTagsList(variant.task5).map((tag, i) => (
                                        <span key={`${tag}-${i}`} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-sans">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="border-[#221E20]/10" />

                {/* Part 2 */}
                <div className="space-y-4">
                    <div className="text-center text-xs uppercase font-bold opacity-60">Часть 2</div>

                    <div className="text-xs text-gray-500 mb-2">
                        Поэт: {variant.poet?.name || '—'}
                        <TaskIdBadge id={variant.poet?.id} extra={(variant.poet as any)?.authorId ? `author:${(variant.poet as any).authorId}` : undefined} />
                        {' | '}Стихотворение: {variant.poem?.title || '—'}
                        <TaskIdBadge id={variant.poem?.id} />
                        {(variant.poem as any)?.themeInternalId && (
                            <span className="ml-1 text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-sans">
                                тема: {(variant.poem as any).themeInternalId}
                            </span>
                        )}
                    </div>

                    <div className="text-center font-bold uppercase text-sm">{variant.poem.title}</div>
                    <RichTextBlock
                        value={variant.poem.text}
                        fallback="Текст стихотворения отсутствует."
                        className="rich-content text-sm leading-relaxed text-center"
                    />

                    <div className="space-y-4">
                        <div>
                            <span className="font-bold">6.</span>{' '}
                            <RichTextBlock value={variant.task6?.part1} fallback="—" as="span" className="rich-content" />{' '}
                            <RichTextBlock value={variant.task6?.part2} fallback="" as="span" className="rich-content" />
                            <TaskIdBadge id={variant.task6?.id} />
                        </div>
                        <div>
                            <span className="font-bold">7.</span>{' '}
                            <RichTextBlock value={variant.task7?.text} fallback="Вопрос не задан" className="rich-content inline" />
                            <TaskIdBadge id={variant.task7?.id} />
                        </div>
                        <div className="space-y-1">
                            <div>
                                <span className="font-bold">8.</span>{' '}
                                <RichTextBlock value={variant.task8?.prompt} fallback="Вопрос не задан" as="span" className="rich-content" />
                                <TaskIdBadge id={variant.task8?.id} />
                            </div>
                            <div className="pl-4">
                                {variant.task8Options.slice(0, ADMIN_USER_VARIANT_TASK8_MAX_OPTIONS).map((opt, i) => (
                                    <div key={`${opt.id}-${i}`}>{i + 1}. {opt.term}</div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="font-bold">9.1</span>{' '}
                            <RichTextBlock value={variant.task9_1?.text} fallback="Вопрос не задан" className="rich-content pl-4 inline" />
                            <TaskIdBadge id={variant.task9_1?.id} />
                            {getTaskTagsList(variant.task9_1).length > 0 && (
                                <div className="pl-8 mt-0.5 flex flex-wrap gap-1">
                                    {getTaskTagsList(variant.task9_1).map((tag, i) => (
                                        <span key={`${tag}-${i}`} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-sans">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <span className="font-bold">9.2</span>{' '}
                            <RichTextBlock value={variant.task9_2?.text} fallback="Вопрос не задан" className="rich-content pl-4 inline" />
                            <TaskIdBadge id={variant.task9_2?.id} />
                            {getTaskTagsList(variant.task9_2).length > 0 && (
                                <div className="pl-8 mt-0.5 flex flex-wrap gap-1">
                                    {getTaskTagsList(variant.task9_2).map((tag, i) => (
                                        <span key={`${tag}-${i}`} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-sans">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <span className="font-bold">10.</span>{' '}
                            <RichTextBlock value={variant.task10?.text} fallback="Вопрос не задан" className="rich-content pl-4 inline" />
                            <TaskIdBadge id={variant.task10?.id} />
                            {getTaskTagsList(variant.task10).length > 0 && (
                                <div className="pl-8 mt-0.5 flex flex-wrap gap-1">
                                    {getTaskTagsList(variant.task10).map((tag, i) => (
                                        <span key={`${tag}-${i}`} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-sans">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="border-[#221E20]/10" />

                {/* Part 3 */}
                <div className="space-y-4">
                    <div className="text-center text-xs uppercase font-bold opacity-60">Часть 3</div>
                    <div className="space-y-3">
                        {([
                            ['11.1', variant.task11_1],
                            ['11.2', variant.task11_2],
                            ['11.3', variant.task11_3],
                            ['11.4', variant.task11_4],
                            ['11.5', variant.task11_5],
                        ] as const).map(([label, task]) => {
                            const taskValue = task as AdminUserVariantPartThreeTask;
                            const rodLabel = getRodLabel((taskValue as any)?.rodId);
                            const isSpecial = (taskValue as any)?.special === true;
                            const tags = getTaskTagsList(taskValue as any);
                            const authorId = (taskValue as any)?.authorId;
                            const authorIds = (taskValue as any)?.authorIds;
                            return (
                                <div key={label}>
                                    <span className="font-bold">{label}</span>{' '}
                                    <RichTextBlock value={(taskValue as any)?.text} fallback="Вопрос не задан" className="rich-content pl-4 inline" />
                                    <TaskIdBadge id={(taskValue as any)?.id} />
                                    {rodLabel && (
                                        <span className="ml-1 text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-sans">
                                            род: {rodLabel}
                                        </span>
                                    )}
                                    {isSpecial && (
                                        <span className="ml-1 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-sans">
                                            исключительный
                                        </span>
                                    )}
                                    {(authorId || authorIds) && (
                                        <span className="ml-1 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-sans">
                                            автор: {authorIds ? (Array.isArray(authorIds) ? authorIds.join(', ') : authorIds) : authorId}
                                        </span>
                                    )}
                                    {tags.length > 0 && (
                                        <div className="pl-8 mt-0.5 flex flex-wrap gap-1">
                                            {tags.map((tag, i) => (
                                                <span key={`${tag}-${i}`} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-sans">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
