import { getPurchaseById } from '@/lib/shopApi';
import type { PurchasedItem } from '@/types/shop';

export const loadMyBookPurchaseById = async (purchaseId: string): Promise<PurchasedItem> => {
    return getPurchaseById(purchaseId);
};
