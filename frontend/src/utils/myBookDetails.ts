import {
    MY_BOOK_DETAILS_CATEGORY_LABELS,
    MY_BOOK_DETAILS_FULFILLMENT_LABELS,
} from '@/consts/utils/myBookDetails';

export { MY_BOOK_DETAILS_FULFILLMENT_LABELS, MY_BOOK_DETAILS_CATEGORY_LABELS };

export const formatMyBookDetailsDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const escapeMyBookDetailsHtml = (value: string): string => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const sanitizeMyBookDetailsRichHtml = (value: string): string => value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/giu, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/giu, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/giu, '')
    .replace(/\sstyle\s*=\s*(['"]).*?\1/giu, '')
    .replace(/<\/?o:p>/giu, '');

export const getMyBookDetailsExcerptHtml = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) {
        return '<p>Текст отрывка отсутствует.</p>';
    }

    const looksLikeHtml = /<\/?[a-z][^>]*>/iu.test(trimmed);
    if (looksLikeHtml) {
        return sanitizeMyBookDetailsRichHtml(trimmed);
    }

    return trimmed
        .split(/\n{2,}/u)
        .map((paragraph) => `<p>${escapeMyBookDetailsHtml(paragraph).replace(/\n/gu, '<br />')}</p>`)
        .join('');
};

export const getMyBookDetailsPackTitle = (purchaseQuantity: number, packIndex: number): string => {
    return purchaseQuantity > 1 ? `Комплект ${packIndex}` : 'Сборник';
};

export const resolveMyBookDetailsPurchaseId = (value: string | string[] | undefined): string => {
    if (!value) return '';
    return Array.isArray(value) ? value[0] : value;
};
