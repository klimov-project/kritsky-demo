import { listPurchases } from '@/lib/shopApi';
import type { MyBooksPurchaseRecord } from '@/types/api/myBooks';

export const loadMyBooksPurchases = async (): Promise<MyBooksPurchaseRecord[]> => {
    return listPurchases();
};
