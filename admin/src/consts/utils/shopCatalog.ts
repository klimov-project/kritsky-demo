import type { ProductCategoryKey } from '@/types/shop';
import type { ShopCatalogFulfillmentFilter } from '@/types/ui/shopCatalog';

export const SHOP_CATALOG_FULFILLMENT_FILTERS: ShopCatalogFulfillmentFilter[] = [
    { key: 'DIGITAL', label: 'Цифровой' },
    { key: 'PHYSICAL', label: 'Физический' },
];

export const HIDDEN_SHOP_CATEGORIES = new Set<ProductCategoryKey>(['download_packs']);
