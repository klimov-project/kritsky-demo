'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import AdminUsersFilters from '@/components/admin/users/AdminUsersFilters';
import AdminUsersTable from '@/components/admin/users/AdminUsersTable';
import { useAdminUsersPage } from '@/hooks/useAdminUsersPage';

export default function AdminUsersPage() {
    const {
        search,
        showFilters,
        statusFilter,
        generatedMin,
        isLoading,
        error,
        pageSize,
        pageSizeOptions,
        pageData,
        currentPage,
        totalPages,
        handleSearchChange,
        handleToggleFilters,
        handleStatusFilterChange,
        handleGeneratedMinChange,
        handleResetFilters,
        handlePageChange,
        handlePageSizeChange,
    } = useAdminUsersPage();

    return (
        <AdminLayout>
            <AdminUsersFilters
                search={search}
                showFilters={showFilters}
                statusFilter={statusFilter}
                generatedMin={generatedMin}
                onSearchChange={handleSearchChange}
                onToggleFilters={handleToggleFilters}
                onStatusFilterChange={handleStatusFilterChange}
                onGeneratedMinChange={handleGeneratedMinChange}
                onResetFilters={handleResetFilters}
            />

            {isLoading && <div className="text-sm opacity-60 mb-4">Загружаю пользователей...</div>}

            {!isLoading && error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
            )}

            {!isLoading && !error && (
                <AdminUsersTable
                    users={pageData}
                    page={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    pageSizeOptions={pageSizeOptions}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                />
            )}
        </AdminLayout>
    );
}
