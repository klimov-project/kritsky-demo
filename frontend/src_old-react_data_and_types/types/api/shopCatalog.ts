import type { ShopProductExtended } from '@/lib/shopApi';
import type { ProductCategoryKey, ProductFulfillment } from '@/types/shop';

export type ShopCatalogProduct = ShopProductExtended;

export type ShopCatalogFavoriteIds = Set<string>;

export type ShopCatalogSelectedCategory = ProductCategoryKey | '';

export type ShopCatalogSelectedFulfillment = ProductFulfillment | '';
