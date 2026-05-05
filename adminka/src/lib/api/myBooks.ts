import { listPurchases, type PurchasesListParams, type PurchasesListResult } from '@/lib/shopApi';
import type { MyBooksPurchaseRecord } from '@/types/api/myBooks';

export const loadMyBooksPurchases = async (): Promise<MyBooksPurchaseRecord[]> => {
    const response = await listPurchases();
    return response.items;
};

export const loadMyBooksPurchasesPage = async (params: PurchasesListParams): Promise<PurchasesListResult> => {
    return listPurchases(params);
};
