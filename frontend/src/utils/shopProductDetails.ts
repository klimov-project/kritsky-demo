import { MARKETPLACES } from '@/mocks/shop';
import type { ShopProductDetailsMarketplaceLink } from '@/types/api/shopProductDetails';
import type { ShopProductExtended } from '@/lib/shopApi';

export const getShopProductDisplayImage = (
    product: ShopProductExtended | null,
    activeImageIndex: number,
): string => {
    if (!product) return '';
    return product.gallery[activeImageIndex] || product.gallery[0] || product.coverUrl || '';
};

export const getShopProductMarketplaceLinks = (
    product: ShopProductExtended | null,
): ShopProductDetailsMarketplaceLink[] => {
    if (!product) return [];
    if (product.marketplaces.length) return product.marketplaces;
    return MARKETPLACES.map((item) => ({ label: item.name, url: item.url }));
};
