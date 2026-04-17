import type { AuthUser } from '@/lib/authApi';
import type { MyBooksCategoryFilter, MyBooksPurchaseRecord } from '@/types/api/myBooks';

export interface MyBookPurchaseCardProps {
    purchase: MyBooksPurchaseRecord;
    onOpenPurchase: (purchaseId: string) => void;
}

export interface UseMyBooksPageResult {
    user: AuthUser | null;
    isAuthLoading: boolean;
    purchases: MyBooksPurchaseRecord[];
    filteredPurchases: MyBooksPurchaseRecord[];
    isLoadingPurchases: boolean;
    error: string;
    categoryFilter: MyBooksCategoryFilter;
    currentCategoryLabel: string;
    clearCategoryFilter: () => void;
    openPurchase: (purchaseId: string) => void;
}
