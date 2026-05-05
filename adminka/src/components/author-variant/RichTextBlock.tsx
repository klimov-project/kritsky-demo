'use client';

import type { AuthorVariantRichTextBlockProps } from '@/types/ui/authorVariant';
import { hasHtmlMarkup } from '@/utils/authorVariant';

export default function RichTextBlock({
    value,
    fallback,
    className,
    as: Component = 'div',
}: AuthorVariantRichTextBlockProps) {
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
