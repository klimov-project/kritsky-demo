'use client';

import type { MyVariantsRichTextBlockProps } from '@/types/ui/myVariants';
import { hasMyVariantsHtmlMarkup } from '@/utils/myVariants';

export default function MyVariantsRichTextBlock({
    value,
    fallback,
    className,
    as: Component = 'div',
}: MyVariantsRichTextBlockProps) {
    const normalized = (value || '').trim();
    const plainClassName = [className, 'whitespace-pre-line'].filter(Boolean).join(' ');
    if (!normalized) {
        return <Component className={plainClassName}>{fallback}</Component>;
    }

    if (hasMyVariantsHtmlMarkup(normalized)) {
        return <Component className={className} dangerouslySetInnerHTML={{ __html: normalized }} />;
    }

    return <Component className={plainClassName}>{normalized}</Component>;
}
