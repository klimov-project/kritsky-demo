'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { listPaymentHistory } from '@/lib/shopApi';
import { getVariantExportQuota, type VariantExportQuota } from '@/lib/variantsApi';
import type { PaymentHistoryItem } from '@/types/shop';
import { EMPTY_QUOTA, getSubscriptionUntilLabel } from '@/components/profile/cabinet/utils';

interface UseProfileCabinetDataResult {
    quota: VariantExportQuota;
    paymentHistory: PaymentHistoryItem[];
    isLoadingData: boolean;
    loadingError: string;
    subscriptionUntilLabel: string;
}

export const useProfileCabinetData = (): UseProfileCabinetDataResult => {
    const { user, isLoading } = useAuth();

    const [quota, setQuota] = useState<VariantExportQuota>(EMPTY_QUOTA);
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [loadingError, setLoadingError] = useState('');

    useEffect(() => {
        if (isLoading || !user || user.role !== 'user') {
            return;
        }

        let cancelled = false;

        const loadCabinetData = async () => {
            setIsLoadingData(true);
            setLoadingError('');
            try {
                const [nextQuota, nextPaymentHistory] = await Promise.all([
                    getVariantExportQuota(),
                    listPaymentHistory(),
                ]);

                if (cancelled) {
                    return;
                }

                setQuota(nextQuota);
                setPaymentHistory(nextPaymentHistory);
            } catch (errorValue) {
                if (cancelled) {
                    return;
                }
                setQuota(EMPTY_QUOTA);
                setPaymentHistory([]);
                setLoadingError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить данные кабинета');
            } finally {
                if (!cancelled) {
                    setIsLoadingData(false);
                }
            }
        };

        void loadCabinetData();

        return () => {
            cancelled = true;
        };
    }, [isLoading, user]);

    const subscriptionUntilLabel = useMemo(() => {
        return getSubscriptionUntilLabel(paymentHistory, user?.isPro || quota.hasActiveSubscription);
    }, [paymentHistory, quota.hasActiveSubscription, user?.isPro]);

    return {
        quota,
        paymentHistory,
        isLoadingData,
        loadingError,
        subscriptionUntilLabel,
    };
};

