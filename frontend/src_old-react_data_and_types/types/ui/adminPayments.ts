import type React from 'react';

import type { AdminPaymentStatCard } from '@/types/api/adminPayments';
import type { AdminPayment } from '@/types/admin';

export interface AdminPaymentsTableColumn {
    header: string;
    accessor: keyof AdminPayment | ((payment: AdminPayment) => React.ReactNode);
    className?: string;
}

export interface AdminPaymentsStatsProps {
    cards: AdminPaymentStatCard[];
}

export interface AdminPaymentsTableProps {
    payments: AdminPayment[];
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}
