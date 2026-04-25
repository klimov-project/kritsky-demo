import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { loadMySavedVariants, removeMySavedVariant } from '@/lib/api/myVariants';
import type { MyVariantsSavedRecord, MyVariantsSavedRecordId } from '@/types/api/myVariants';
import type { UseMyVariantsPageResult } from '@/types/ui/myVariants';
import { sortMyVariantsByDateDesc } from '@/utils/myVariants';

export const useMyVariantsPage = (): UseMyVariantsPageResult => {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [savedVariants, setSavedVariants] = useState<MyVariantsSavedRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user || user.role !== 'user') {
            router.replace('/login');
            return;
        }

        let cancelled = false;

        const load = async () => {
            setError('');
            setIsLoaded(false);
            try {
                const items = await loadMySavedVariants();
                if (!cancelled) {
                    setSavedVariants(items);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить сохранённые варианты');
                }
            } finally {
                if (!cancelled) {
                    setIsLoaded(true);
                }
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [isAuthLoading, router, user]);

    const variants = useMemo(() => {
        return sortMyVariantsByDateDesc(savedVariants);
    }, [savedVariants]);

    const handleDeleteVariant = useCallback(async (id: MyVariantsSavedRecordId) => {
        try {
            await removeMySavedVariant(id);
            setSavedVariants((previous) => previous.filter((variant) => variant.id !== id));
            return true;
        } catch {
            return false;
        }
    }, []);

    const goToGenerator = useCallback(() => {
        router.push('/new_test');
    }, [router]);

    return {
        user,
        isAuthLoading,
        isLoaded,
        error,
        variants,
        goToGenerator,
        handleDeleteVariant,
    };
};
