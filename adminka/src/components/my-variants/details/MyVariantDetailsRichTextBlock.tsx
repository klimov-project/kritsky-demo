'use client';

import type { MyVariantDetailsRichTextBlockProps } from '@/types/ui/myVariantDetails';
import { hasMyVariantDetailsHtmlMarkup } from '@/utils/myVariantDetails';

export default function MyVariantDetailsRichTextBlock({
    value,
    fallback,
    className,
    as: Component = 'div',
}: MyVariantDetailsRichTextBlockProps) {
    const normalized = (value || '').trim();
    const plainClassName = [className, 'whitespace-pre-line'].filter(Boolean).join(' ');
    if (!normalized) {
        return <Component className={plainClassName}>{fallback}</Component>;
    }

    if (hasMyVariantDetailsHtmlMarkup(normalized)) {
        return <Component className={className} dangerouslySetInnerHTML={{ __html: normalized }} />;
    }

    return <Component className={plainClassName}>{normalized}</Component>;
}
