import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { loadSavedFavoriteProducts } from '@/lib/api/savedPage';
import type { SavedPageFavoriteProduct } from '@/types/api/savedPage';
import type { UseSavedPageResult } from '@/types/ui/savedPage';

export const useSavedPage = (): UseSavedPageResult => {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [favorites, setFavorites] = useState<SavedPageFavoriteProduct[]>([]);
    const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user || user.role !== 'user') {
            router.push('/login');
            return;
        }

        let cancelled = false;

        const loadFavorites = async () => {
            setError('');
            setIsLoadingFavorites(true);

            try {
                const items = await loadSavedFavoriteProducts();
                if (!cancelled) {
                    setFavorites(items);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить избранное');
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingFavorites(false);
                }
            }
        };

        void loadFavorites();
        return () => {
            cancelled = true;
        };
    }, [isAuthLoading, router, user]);

    const openProduct = (productId: string) => {
        router.push(`/shop/${productId}`);
    };

    return {
        user,
        isAuthLoading,
        favorites,
        isLoadingFavorites,
        error,
        openProduct,
    };
};
