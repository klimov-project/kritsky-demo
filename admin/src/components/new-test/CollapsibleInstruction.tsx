import { useState } from 'react';
import { IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import type { CollapsibleInstructionProps } from '@/types/ui/newTestPage';
import { normalizeNbspText } from '@/utils/newTest';
import RichTextBlock from '@/components/new-test/RichTextBlock';
import styles from './CollapsibleInstruction.module.scss';

export default function CollapsibleInstruction({
    value,
    fallback,
    collapsible = true,
    className = '',
}: CollapsibleInstructionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const normalized = normalizeNbspText((value || '').trim());
    const isCollapsible = collapsible && Boolean(normalized);

    return (
        <div className={`${styles.root} ${className}`.trim()}>
            <div
                className={[
                    'collapsible-instruction-content',
                    styles.content,
                    isExpanded || !isCollapsible ? styles.contentExpanded : styles.contentCollapsed,
                ].join(' ').trim()}
            >
                <RichTextBlock
                    value={normalized}
                    fallback={fallback}
                    className="rich-content variant-copy"
                />
            </div>
            {isCollapsible && (
                <div className={`no-print ${styles.toggleWrap}`}>
                    <button
                        type="button"
                        className={styles.toggleButton}
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
