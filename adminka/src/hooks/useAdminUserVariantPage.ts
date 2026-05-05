import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { loadAdminUserVariant } from '@/lib/api/adminUserVariants';
import type { SavedVariantRecord } from '@/types/testVariant';
import { getAdminUserVariantErrorMessage } from '@/utils/adminUserVariant';

export const useAdminUserVariantPage = () => {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const variantId = Number(params?.id);

    const [savedVariant, setSavedVariant] = useState<SavedVariantRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!variantId || Number.isNaN(variantId)) return;

        let cancelled = false;

        setIsLoading(true);
        setError('');

        void loadAdminUserVariant(variantId)
            .then((response) => {
                if (!cancelled) {
                    setSavedVariant(response.savedVariant);
                }
            })
            .catch((errorValue: unknown) => {
                if (!cancelled) {
                    setError(getAdminUserVariantErrorMessage(errorValue));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [variantId]);

    return {
        savedVariant,
        isLoading,
        error,
        handleBack: () => router.back(),
    };
};
