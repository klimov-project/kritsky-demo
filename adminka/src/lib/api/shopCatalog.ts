import {
    addProductToCart,
    addProductToFavorites,
    listFavoriteProductIds,
    listShopProducts,
    removeProductFromFavorites,
} from '@/lib/shopApi';
import type { ShopCatalogProduct } from '@/types/api/shopCatalog';

export const loadShopCatalogProducts = async (): Promise<ShopCatalogProduct[]> => {
    const response = await listShopProducts({ limit: 200, offset: 0 });
    return response.items;
};

export const loadShopCatalogFavoriteIds = async (): Promise<Set<string>> => {
    return listFavoriteProductIds();
};

export const addShopCatalogProductToFavorites = async (productId: string): Promise<void> => {
    await addProductToFavorites(productId);
};

export const removeShopCatalogProductFromFavorites = async (productId: string): Promise<void> => {
    await removeProductFromFavorites(productId);
};

export const addShopCatalogProductToCart = async (productId: string): Promise<void> => {
    await addProductToCart(productId, 1);
};
