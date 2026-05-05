'use client';

import { useState } from 'react';
import { IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';

import RichTextBlock from '@/components/author-variant/RichTextBlock';
import type { AuthorVariantCollapsibleInstructionProps } from '@/types/ui/authorVariant';

export default function CollapsibleInstruction({
    value,
    fallback,
}: AuthorVariantCollapsibleInstructionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const normalized = (value || '').trim();
    const isCollapsible = Boolean(normalized);

    return (
        <div className="border border-gray-400 px-4 py-3 text-center text-sm leading-relaxed">
            <div
                className={`overflow-hidden transition-[max-height] duration-300 ease-out ${isExpanded || !isCollapsible ? 'max-h-[40rem]' : 'max-h-[4.8em]'}`}
            >
                <RichTextBlock
                    value={value}
                    fallback={fallback}
                    className="rich-content variant-copy text-sm leading-relaxed text-center"
                />
            </div>
            {isCollapsible && (
                <div className="no-print mt-3 flex justify-center">
                    <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-400 bg-white text-[#221E20]/75 transition-colors hover:bg-[#faf7ef] hover:text-[#221E20]"
                        onClick={() => setIsExpanded((prev) => !prev)}
                        aria-label={isExpanded ? 'Свернуть блок' : 'Развернуть блок'}
                    >
                        {isExpanded ? <IoChevronUpOutline size={16} /> : <IoChevronDownOutline size={16} />}
                    </button>
                </div>
            )}
        </div>
    );
}
