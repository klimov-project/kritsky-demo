'use client';

import AdminUserVariantViewContent from '@/components/admin/users/variants/AdminUserVariantViewContent';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAdminUserVariantPage } from '@/hooks/useAdminUserVariantPage';

export default function AdminVariantViewPage() {
    const { savedVariant, isLoading, error, handleBack } = useAdminUserVariantPage();

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="opacity-60 text-sm">Загрузка варианта...</div>
            </AdminLayout>
        );
    }

    if (error || !savedVariant) {
        return (
            <AdminLayout>
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                    {error || 'Вариант не найден'}
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <AdminUserVariantViewContent savedVariant={savedVariant} onBack={handleBack} />
        </AdminLayout>
    );
}
