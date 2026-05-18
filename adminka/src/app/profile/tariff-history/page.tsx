'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { ProfileCabinetShell } from '@/components/profile/cabinet';
import { ProfilePaymentHistorySection } from '@/components/profile/cabinet/sections';
import { formatDateFromIso, getSubscriptionRangeLabel } from '@/components/profile/cabinet/utils';
import PageLayout from '@/components/layout/PageLayout';
import { useAuth } from '@/context/AuthContext';
import { useProfileCabinetData } from '@/hooks/useProfileCabinetData';

export default function TariffHistoryPage() {
    const router = useRouter();
    const { user, isLoading, logout } = useAuth();
    const {
        paymentHistory,
        isLoadingData,
        loadingError,
        subscriptionUntilLabel,
    } = useProfileCabinetData();

    useEffect(() => {
        if (isLoading) {
            return;
        }
        if (!user || user.role !== 'user') {
            router.replace('/?modal=login');
        }
    }, [isLoading, router, user]);

    const rows = useMemo(() => {
        return paymentHistory
            .filter((payment) => payment.kind === 'subscription')
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
            .map((payment) => ({
                id: payment.id,
                dateLabel: formatDateFromIso(payment.createdAt, 'numeric'),
                periodLabel: getSubscriptionRangeLabel(payment.createdAt),
            }));
    }, [paymentHistory]);

    if (isLoading || !user || user.role !== 'user') {
        return null;
    }

    return (
        <PageLayout bodyClassName="index-page">
            <ProfileCabinetShell
                activeSection="payments"
                subscriptionUntilLabel={subscriptionUntilLabel}
                onLogout={() => logout('/?modal=login')}
                showMobileSideCards
            >
                <ProfilePaymentHistorySection
                    rows={rows}
                    isLoading={isLoadingData}
                    loadingError={loadingError}
                />
            </ProfileCabinetShell>
        </PageLayout>
    );
}

