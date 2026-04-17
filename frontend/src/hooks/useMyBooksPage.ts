import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { loadMyBooksPurchases } from '@/lib/api/myBooks';
import type { MyBooksPurchaseRecord } from '@/types/api/myBooks';
import type { UseMyBooksPageResult } from '@/types/ui/myBooks';
import {
    filterMyBooksPurchasesByCategory,
    getMyBooksCurrentCategoryLabel,
    resolveMyBooksCategoryFilter,
} from '@/utils/myBooks';

export const useMyBooksPage = (): UseMyBooksPageResult => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [purchases, setPurchases] = useState<MyBooksPurchaseRecord[]>([]);
    const [isLoadingPurchases, setIsLoadingPurchases] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user || user.role !== 'user') {
            router.replace('/login');
            return;
        }

        let cancelled = false;

        const load = async () => {
            setIsLoadingPurchases(true);
            setError('');
            try {
                const items = await loadMyBooksPurchases();
                if (!cancelled) {
                    setPurchases(items);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить покупки');
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingPurchases(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [isAuthLoading, router, user]);

    const categoryFilter = useMemo(
        () => resolveMyBooksCategoryFilter(searchParams.get('category')),
        [searchParams],
    );

    const filteredPurchases = useMemo(
        () => filterMyBooksPurchasesByCategory(purchases, categoryFilter),
        [categoryFilter, purchases],
    );

    const currentCategoryLabel = useMemo(
        () => getMyBooksCurrentCategoryLabel(categoryFilter),
        [categoryFilter],
    );

    const clearCategoryFilter = useCallback(() => {
        router.push('/my-books');
    }, [router]);

    const openPurchase = useCallback((purchaseId: string) => {
        router.push(`/my-books/${purchaseId}`);
    }, [router]);

    return {
        user,
        isAuthLoading,
        purchases,
        filteredPurchases,
        isLoadingPurchases,
        error,
        categoryFilter,
        currentCategoryLabel,
        clearCategoryFilter,
        openPurchase,
    };
};
