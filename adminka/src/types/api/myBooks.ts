import type { PurchasedItem, ProductCategoryKey } from '@/types/shop';

export type MyBooksPurchaseRecord = PurchasedItem;

export type MyBooksCategoryFilter = ProductCategoryKey | '';

export interface MyBooksPurchasesMeta {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
    query: string;
}
