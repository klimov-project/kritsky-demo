'use client';

import AdminPaymentsStats from '@/components/admin/payments/AdminPaymentsStats';
import AdminPaymentsTable from '@/components/admin/payments/AdminPaymentsTable';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAdminPaymentsPage } from '@/hooks/useAdminPaymentsPage';

export default function AdminPaymentsPage() {
    const {
        isLoading,
        error,
        pageData,
        currentPage,
        totalPages,
        statsCards,
        handlePageChange,
    } = useAdminPaymentsPage();

    return (
        <AdminLayout>
            {isLoading && <div className="text-sm opacity-60 mb-6">Загружаю оплаты...</div>}
            {!isLoading && error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
            )}

            <AdminPaymentsStats cards={statsCards} />

            {!isLoading && !error && (
                <AdminPaymentsTable
                    payments={pageData}
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </AdminLayout>
    );
}
