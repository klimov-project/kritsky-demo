import type { ShopProductExtended } from '@/lib/shopApi';

export type ShopProductDetailsProduct = ShopProductExtended | null;

export type ShopProductDetailsMarketplaceLink = ShopProductExtended['marketplaces'][number];
