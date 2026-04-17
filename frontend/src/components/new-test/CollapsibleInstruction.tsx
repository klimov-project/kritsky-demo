import { useState } from 'react';
import { IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import type { CollapsibleInstructionProps } from '@/types/ui/newTestPage';
import { normalizeNbspText } from '@/utils/newTest';
import RichTextBlock from '@/components/new-test/RichTextBlock';

export default function CollapsibleInstruction({
    value,
    fallback,
    collapsible = true,
}: CollapsibleInstructionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const normalized = normalizeNbspText((value || '').trim());
    const isCollapsible = collapsible && Boolean(normalized);

    return (
        <div className="border border-gray-400 px-4 py-3 text-sm leading-relaxed">
            <div
                className={`collapsible-instruction-content overflow-hidden transition-[max-height] duration-300 ease-out ${isExpanded || !isCollapsible ? 'max-h-[40rem]' : 'max-h-[3.6em]'}`}
            >
                <RichTextBlock
                    value={normalized}
                    fallback={fallback}
                    className="rich-content variant-copy text-sm leading-relaxed"
                />
            </div>
            {isCollapsible && (
                <div className="no-print mt-1 flex justify-center">
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
