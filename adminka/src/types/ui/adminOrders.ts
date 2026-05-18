import type React from 'react';

import type { AdminOrder } from '@/types/admin';

export interface AdminOrdersTableColumn {
    header: string;
    accessor: keyof AdminOrder | ((order: AdminOrder) => React.ReactNode);
    className?: string;
}

export interface AdminOrdersTableProps {
    orders: AdminOrder[];
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}
