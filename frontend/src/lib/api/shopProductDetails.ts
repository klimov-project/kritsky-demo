import {
    addProductToCart,
    addProductToFavorites,
    getShopProductById,
    listFavoriteProductIds,
    removeProductFromFavorites,
    type ShopProductExtended,
} from '@/lib/shopApi';

export const loadShopProductDetails = async (productId: string): Promise<ShopProductExtended> => {
    return getShopProductById(productId);
};

export const loadShopFavoriteProductIds = async (): Promise<Set<string>> => {
    return listFavoriteProductIds();
};

export const addShopProductToFavorites = async (productId: string): Promise<void> => {
    await addProductToFavorites(productId);
};

export const removeShopProductFromFavorites = async (productId: string): Promise<void> => {
    await removeProductFromFavorites(productId);
};

export const addShopProductToCart = async (productId: string): Promise<void> => {
    await addProductToCart(productId, 1);
};
