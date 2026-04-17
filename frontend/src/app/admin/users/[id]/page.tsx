'use client';

import Link from 'next/link';

import AdminUserDetailContent from '@/components/admin/users/AdminUserDetailContent';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAdminUserDetailPage } from '@/hooks/useAdminUserDetailPage';

export default function AdminUserDetailPage() {
    const {
        user,
        isLoading,
        error,
        actionLoading,
        customDate,
        creditsInput,
        collectionsOrders,
        downloadPackOrders,
        setCustomDate,
        setCreditsInput,
        handleBlockToggle,
        handleGiveSubscription,
        handleGiveSubscriptionUntilDate,
        handleRemoveSubscription,
        handleSetDownloadCredits,
    } = useAdminUserDetailPage();

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="opacity-60 text-sm">Загрузка карточки пользователя...</div>
            </AdminLayout>
        );
    }

    if (error || !user) {
        return (
            <AdminLayout>
                <Link href="/admin/users" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
                    &larr; Назад к пользователям
                </Link>
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                    {error || 'Пользователь не найден'}
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <AdminUserDetailContent
                user={user}
                actionLoading={actionLoading}
                customDate={customDate}
                creditsInput={creditsInput}
                collectionsOrders={collectionsOrders}
                downloadPackOrders={downloadPackOrders}
                onCustomDateChange={setCustomDate}
                onCreditsInputChange={setCreditsInput}
                onBlockToggle={handleBlockToggle}
                onGiveSubscription={handleGiveSubscription}
                onGiveSubscriptionUntilDate={handleGiveSubscriptionUntilDate}
                onRemoveSubscription={handleRemoveSubscription}
                onSetDownloadCredits={handleSetDownloadCredits}
            />
        </AdminLayout>
    );
}
