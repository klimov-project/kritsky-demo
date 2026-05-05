import type { AuthUser } from '@/lib/authApi';
import type { MyBooksCategoryFilter, MyBooksPurchaseRecord, MyBooksPurchasesMeta } from '@/types/api/myBooks';

export interface MyBookPurchaseCardProps {
    purchase: MyBooksPurchaseRecord;
    onOpenPurchase: (purchaseId: string) => void;
}

export interface UseMyBooksPageResult {
    user: AuthUser | null;
    isAuthLoading: boolean;
    purchases: MyBooksPurchaseRecord[];
    filteredPurchases: MyBooksPurchaseRecord[];
    purchasesMeta: MyBooksPurchasesMeta;
    isLoadingPurchases: boolean;
    error: string;
    categoryFilter: MyBooksCategoryFilter;
    query: string;
    currentCategoryLabel: string;
    clearCategoryFilter: () => void;
    openPurchase: (purchaseId: string) => void;
    setPage: (page: number) => void;
}
