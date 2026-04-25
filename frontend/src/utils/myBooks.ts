import type { MyBooksCategoryFilter, MyBooksPurchaseRecord } from '@/types/api/myBooks';
import {
    MY_BOOKS_CATEGORY_LABELS,
    MY_BOOKS_FULFILLMENT_LABELS,
} from '@/consts/utils/myBooks';
import type { ProductCategoryKey } from '@/types/shop';

export { MY_BOOKS_FULFILLMENT_LABELS, MY_BOOKS_CATEGORY_LABELS };

export const formatMyBooksDate = (value: string): string => {
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

export const resolveMyBooksCategoryFilter = (value: string | null): MyBooksCategoryFilter => {
    if (!value) return '';
    return value as ProductCategoryKey;
};

export const getMyBooksCurrentCategoryLabel = (categoryFilter: MyBooksCategoryFilter): string => {
    if (!categoryFilter) return '';
    return MY_BOOKS_CATEGORY_LABELS[categoryFilter] || categoryFilter;
};

export const filterMyBooksPurchasesByCategory = (
    purchases: MyBooksPurchaseRecord[],
    categoryFilter: MyBooksCategoryFilter,
): MyBooksPurchaseRecord[] => {
    if (!categoryFilter) return purchases;
    return purchases.filter((purchase) => purchase.category === categoryFilter);
};
