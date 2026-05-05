import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { loadMyBooksPurchasesPage } from '@/lib/api/myBooks';
import type { MyBooksPurchaseRecord, MyBooksPurchasesMeta } from '@/types/api/myBooks';
import type { UseMyBooksPageResult } from '@/types/ui/myBooks';
import {
    filterMyBooksPurchasesByCategory,
    getMyBooksCurrentCategoryLabel,
    resolveMyBooksCategoryFilter,
} from '@/utils/myBooks';

const DEFAULT_LIMIT = 5;

const resolvePositiveInt = (value: string | null, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export const useMyBooksPage = (): UseMyBooksPageResult => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [purchases, setPurchases] = useState<MyBooksPurchaseRecord[]>([]);
    const [purchasesMeta, setPurchasesMeta] = useState<MyBooksPurchasesMeta>({
        total: 0,
        limit: DEFAULT_LIMIT,
        page: 1,
        totalPages: 1,
        query: '',
    });
    const [isLoadingPurchases, setIsLoadingPurchases] = useState(true);
    const [error, setError] = useState('');

    const page = useMemo(() => resolvePositiveInt(searchParams.get('page'), 1), [searchParams]);
    const limit = useMemo(() => resolvePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT), [searchParams]);
    const query = useMemo(() => (searchParams.get('query') || '').trim(), [searchParams]);

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
                const response = await loadMyBooksPurchasesPage({
                    page,
                    limit,
                    query,
                });
                if (!cancelled) {
                    setPurchases(response.items);
                    setPurchasesMeta({
                        total: response.total,
                        limit: response.limit,
                        page: response.page,
                        totalPages: response.totalPages,
                        query: response.query,
                    });
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
    }, [isAuthLoading, limit, page, query, router, user]);

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

    const setPage = useCallback((nextPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(Math.max(1, nextPage)));
        params.set('limit', String(limit));
        router.push(`/my-books?${params.toString()}`);
    }, [limit, router, searchParams]);

    return {
        user,
        isAuthLoading,
        purchases,
        filteredPurchases,
        purchasesMeta,
        isLoadingPurchases,
        error,
        categoryFilter,
        query,
        currentCategoryLabel,
        clearCategoryFilter,
        openPurchase,
        setPage,
    };
};
