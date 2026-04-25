'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ProfileCabinetShell } from '@/components/profile/cabinet';
import { ProfileSubscriptionSection } from '@/components/profile/cabinet/sections';
import PageLayout from '@/components/layout/PageLayout';
import { useAuth } from '@/context/AuthContext';
import { useProfileCabinetData } from '@/hooks/useProfileCabinetData';

export default function TariffPage() {
    const router = useRouter();
    const { user, isLoading, logout } = useAuth();
    const {
        quota,
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

    if (isLoading || !user || user.role !== 'user') {
        return null;
    }

    return (
        <PageLayout bodyClassName="index-page">
            <ProfileCabinetShell
                activeSection="subscription"
                subscriptionUntilLabel={subscriptionUntilLabel}
                onLogout={() => logout('/?modal=login')}
                showMobileSideCards={false}
            >
                <ProfileSubscriptionSection
                    quota={quota}
                    isLoading={isLoadingData}
                    loadingError={loadingError}
                    subscriptionUntilLabel={subscriptionUntilLabel}
                    hasActiveSubscription={user.isPro || quota.hasActiveSubscription}
                    onRenewSubscription={() => router.push('/shop')}
                    onBuyPacks={() => router.push('/profile/download-packs')}
                />
            </ProfileCabinetShell>
        </PageLayout>
    );
}

