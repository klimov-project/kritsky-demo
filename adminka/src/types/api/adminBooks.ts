import type { ShopBookPayload, ShopProductExtended } from '@/lib/shopApi';
import type { CollectionProductConfig, ProductCategoryKey, ProductFulfillment } from '@/types/shop';

export type ProductRecord = ShopProductExtended & { stats: string };

export type CollectionAuthorOption = CollectionProductConfig;

export type CollectionKind = NonNullable<CollectionProductConfig['collectionKind']>;

export type AdminBookPayload = ShopBookPayload;

export interface AdminBooksLoadResult {
    products: ProductRecord[];
    collectionAuthors: CollectionAuthorOption[];
}

export interface AdminBooksDraftState {
    category: ProductCategoryKey;
    fulfillment: ProductFulfillment;
    collectionAuthorId: string;
    collectionKind: CollectionKind;
    downloadPackCount: string;
}
