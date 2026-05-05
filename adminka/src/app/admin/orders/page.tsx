'use client';

import AdminOrdersTable from '@/components/admin/orders/AdminOrdersTable';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAdminOrdersPage } from '@/hooks/useAdminOrdersPage';

export default function AdminOrdersPage() {
    const {
        isLoading,
        error,
        pageData,
        currentPage,
        totalPages,
        handlePageChange,
    } = useAdminOrdersPage();

    return (
        <AdminLayout>
            {isLoading && <div className="text-sm opacity-60 mb-4">Загружаю заказы...</div>}
            {!isLoading && error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
            )}

            {!isLoading && !error && (
                <AdminOrdersTable
                    orders={pageData}
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </AdminLayout>
    );
}
