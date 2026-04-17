import { PRODUCTS_LIMIT } from '@/consts/api/adminBooks';
import { fetchKnowledgeBase } from '@/lib/knowledgeBaseApi';
import { createShopProduct, deleteShopProduct, listShopProducts, updateShopProduct } from '@/lib/shopApi';
import type { AdminBookPayload, AdminBooksLoadResult, ProductRecord } from '@/types/api/adminBooks';
import { buildCollectionAuthors, toProductRecord } from '@/utils/adminBooks';

export const loadAdminBooksData = async (): Promise<AdminBooksLoadResult> => {
    const [productsResponse, knowledgeBase] = await Promise.all([
        listShopProducts({ limit: PRODUCTS_LIMIT, offset: 0 }),
        fetchKnowledgeBase(),
    ]);

    return {
        products: productsResponse.items.map((item) => toProductRecord(item)),
        collectionAuthors: buildCollectionAuthors(knowledgeBase),
    };
};

export const createAdminBook = async (payload: AdminBookPayload): Promise<ProductRecord> => {
    const product = await createShopProduct(payload);
    return toProductRecord(product);
};

export const updateAdminBookById = async (productId: string, payload: AdminBookPayload): Promise<ProductRecord> => {
    const product = await updateShopProduct(productId, payload);
    return toProductRecord(product);
};

export const deleteAdminBookById = async (productId: string): Promise<void> => {
    await deleteShopProduct(productId);
};
