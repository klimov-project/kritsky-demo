import { PRODUCT_CATEGORIES } from '@/mocks/shop';
import {
    HIDDEN_SHOP_CATEGORIES,
    SHOP_CATALOG_FULFILLMENT_FILTERS,
} from '@/consts/utils/shopCatalog';
import type {
    ShopCatalogProduct,
    ShopCatalogSelectedCategory,
    ShopCatalogSelectedFulfillment,
} from '@/types/api/shopCatalog';
import type { ProductCategory, ProductCategoryKey } from '@/types/shop';

export { SHOP_CATALOG_FULFILLMENT_FILTERS, HIDDEN_SHOP_CATEGORIES };

export const resolveShopCatalogCategoryQuery = (queryCategory: string | null): ShopCatalogSelectedCategory => {
    if (
        queryCategory
        && PRODUCT_CATEGORIES.some((category) => category.key === queryCategory)
        && !HIDDEN_SHOP_CATEGORIES.has(queryCategory as ProductCategoryKey)
    ) {
        return queryCategory as ProductCategoryKey;
    }

    return '';
};

export const resolveShopCatalogFulfillmentQuery = (queryFulfillment: string | null): ShopCatalogSelectedFulfillment => {
    if (queryFulfillment === 'DIGITAL' || queryFulfillment === 'PHYSICAL') {
        return queryFulfillment;
    }

    return '';
};

export const getShopCatalogVisibleProducts = (products: ShopCatalogProduct[]): ShopCatalogProduct[] => {
    return products.filter((item) => !HIDDEN_SHOP_CATEGORIES.has(item.category));
};

export const getShopCatalogAuthors = (products: ShopCatalogProduct[]): string[] => {
    return Array.from(new Set(products.map((item) => item.author)));
};

export const getShopCatalogVisibleCategories = (): ProductCategory[] => {
    return PRODUCT_CATEGORIES.filter((category) => !HIDDEN_SHOP_CATEGORIES.has(category.key));
};

export const filterShopCatalogProducts = (
    products: ShopCatalogProduct[],
    searchValue: string,
    selectedCategory: ShopCatalogSelectedCategory,
    selectedAuthor: string,
    selectedFulfillment: ShopCatalogSelectedFulfillment,
): ShopCatalogProduct[] => {
    return products.filter((product) => {
        const searchable = `${product.title} ${product.description} ${product.author}`.toLowerCase();
        const matchesSearch = searchValue ? searchable.includes(searchValue.toLowerCase()) : true;
        const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
        const matchesAuthor = selectedAuthor ? product.author === selectedAuthor : true;
        const matchesFulfillment = selectedFulfillment ? product.fulfillment === selectedFulfillment : true;

        return matchesSearch && matchesCategory && matchesAuthor && matchesFulfillment;
    });
};
