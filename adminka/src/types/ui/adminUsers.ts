import type React from 'react';

import type { AdminSubscriptionStatus, AdminUser } from '@/types/admin';

export type AdminUsersStatusFilter = 'All' | AdminSubscriptionStatus;

export interface AdminUsersTableColumn {
    header: string;
    accessor: keyof AdminUser | ((user: AdminUser) => React.ReactNode);
    className?: string;
}

export interface AdminUsersFiltersProps {
    search: string;
    showFilters: boolean;
    statusFilter: AdminUsersStatusFilter;
    generatedMin: string;
    onSearchChange: (value: string) => void;
    onToggleFilters: () => void;
    onStatusFilterChange: (value: AdminUsersStatusFilter) => void;
    onGeneratedMinChange: (value: string) => void;
    onResetFilters: () => void;
}

export interface AdminUsersTableProps {
    users: AdminUser[];
    page: number;
    totalPages: number;
    pageSize: number;
    pageSizeOptions: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}
