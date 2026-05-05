import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
    consumeMyVariantDetailsExportQuota,
    loadMyVariantDetailsById,
    loadMyVariantDetailsExportQuota,
} from '@/lib/api/myVariantDetails';
import type { MyVariantDetailsExportQuota, MyVariantDetailsSavedVariant } from '@/types/api/myVariantDetails';
import type { UseMyVariantDetailsPageResult } from '@/types/ui/myVariantDetails';
import {
    downloadSavedVariantAsJson,
    resolveVariantIdFromParams,
} from '@/utils/myVariantDetails';

export const useMyVariantDetailsPage = (): UseMyVariantDetailsPageResult => {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const params = useParams<{ id: string }>();
    const variantId = useMemo(() => resolveVariantIdFromParams(params?.id), [params]);

    const [savedVariant, setSavedVariant] = useState<MyVariantDetailsSavedVariant>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState('');
    const [exportQuota, setExportQuota] = useState<MyVariantDetailsExportQuota>(null);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user || user.role !== 'user') {
            router.replace('/login');
            return;
        }
        if (!variantId) return;

        let cancelled = false;

        const load = async () => {
            setIsLoaded(false);
            setError('');
            setSavedVariant(null);
            try {
                const item = await loadMyVariantDetailsById(variantId);
                if (!cancelled) {
                    setSavedVariant(item);
                }
                if (user.role === 'user') {
                    const quota = await loadMyVariantDetailsExportQuota();
                    if (!cancelled) {
                        setExportQuota(quota);
                    }
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить вариант');
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
    }, [isAuthLoading, router, user, variantId]);

    const handleDownload = useCallback(async () => {
        if (!savedVariant) return;

        try {
            const result = await consumeMyVariantDetailsExportQuota(savedVariant.id, 'download');
            setExportQuota(result.quota);
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Скачивание недоступно');
            return;
        }

        downloadSavedVariantAsJson(savedVariant);
    }, [savedVariant]);

    const handlePrint = useCallback(async () => {
        if (!savedVariant) return;

        try {
            const result = await consumeMyVariantDetailsExportQuota(savedVariant.id, 'print');
            setExportQuota(result.quota);
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Печать недоступна');
            return;
        }

        window.print();
    }, [savedVariant]);

    const goToVariants = useCallback(() => {
        router.push('/my-variants');
    }, [router]);

    const goToGenerator = useCallback(() => {
        router.push('/new_test');
    }, [router]);

    return {
        user,
        isAuthLoading,
        savedVariant,
        isLoaded,
        error,
        exportQuota,
        handleDownload,
        handlePrint,
        goToVariants,
        goToGenerator,
    };
};
