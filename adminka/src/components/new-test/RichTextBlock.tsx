import type { RichTextBlockProps } from '@/types/ui/newTestPage';
import { hasHtmlMarkup, normalizeNbspText } from '@/utils/newTest';

export default function RichTextBlock({
    value,
    fallback = '',
    className,
    as: Tag = 'div',
}: RichTextBlockProps) {
    const normalized = normalizeNbspText((value || '').trim());
    const normalizedFallback = normalizeNbspText(fallback);
    const plainClassName = [className, 'whitespace-pre-line'].filter(Boolean).join(' ');

    if (!normalized) {
        return <Tag className={plainClassName}>{normalizedFallback}</Tag>;
    }

    if (hasHtmlMarkup(normalized)) {
        return <Tag className={className} dangerouslySetInnerHTML={{ __html: normalized }} />;
    }

    return <Tag className={plainClassName}>{normalized}</Tag>;
}
