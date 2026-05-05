'use client';

import AdminDashboardMetrics from '@/components/admin/dashboard/AdminDashboardMetrics';
import AdminDashboardQuickLinks from '@/components/admin/dashboard/AdminDashboardQuickLinks';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAdminDashboardPage } from '@/hooks/useAdminDashboardPage';

export default function AdminDashboardPage() {
    const { isLoading, error, cards, quickLinks } = useAdminDashboardPage();

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="font-serif text-4xl font-bold text-[#221E20]">Дашборд</h1>
                <p className="text-[#221E20]/60 mt-2">Сводка по ключевым метрикам платформы.</p>
            </div>

            {isLoading && <div className="text-sm opacity-60 mb-6">Загружаю статистику...</div>}
            {!isLoading && error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
            )}

            <AdminDashboardMetrics cards={cards} />
            <AdminDashboardQuickLinks links={quickLinks} />
        </AdminLayout>
    );
}
