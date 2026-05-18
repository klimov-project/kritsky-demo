import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { loadMyBookPurchaseById } from '@/lib/api/myBookDetails';
import type { MyBookDetailsPurchase, MyBookDetailsRevealedAnswers } from '@/types/api/myBookDetails';
import type { UseMyBookDetailsPageResult } from '@/types/ui/myBookDetails';
import { resolveMyBookDetailsPurchaseId } from '@/utils/myBookDetails';

export const useMyBookDetailsPage = (): UseMyBookDetailsPageResult => {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const params = useParams<{ id?: string | string[] }>();
    const purchaseId = useMemo(() => resolveMyBookDetailsPurchaseId(params?.id), [params]);

    const [purchase, setPurchase] = useState<MyBookDetailsPurchase>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [revealedAnswers, setRevealedAnswers] = useState<MyBookDetailsRevealedAnswers>({});

    const toggleAnswers = useCallback((variantId: string) => {
        setRevealedAnswers((current) => ({
            ...current,
            [variantId]: !current[variantId],
        }));
    }, []);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const handleDownloadPdf = useCallback(() => {
        window.print();
    }, []);

    const goToMyBooks = useCallback(() => {
        router.push('/my-books');
    }, [router]);

    const goToShopProduct = useCallback((bookId: string) => {
        router.push(`/shop/${bookId}`);
    }, [router]);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user || user.role !== 'user') {
            router.replace('/login');
            return;
        }
        if (!purchaseId) return;

        let cancelled = false;

        const load = async () => {
            setIsPageLoading(true);
            setError('');
            try {
                const item = await loadMyBookPurchaseById(purchaseId);
                if (!cancelled) {
                    setPurchase(item);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить покупку');
                }
            } finally {
                if (!cancelled) {
                    setIsPageLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [isAuthLoading, purchaseId, router, user]);

    return {
        user,
        isAuthLoading,
        purchase,
        isPageLoading,
        error,
        revealedAnswers,
        toggleAnswers,
        handlePrint,
        handleDownloadPdf,
        goToMyBooks,
        goToShopProduct,
    };
};
