import type { AdminDashboardStats, AdminPayment } from '@/types/admin';

export interface AdminPaymentsLoadResult {
    payments: AdminPayment[];
    dashboard: AdminDashboardStats;
}

export interface AdminPaymentStatCard {
    label: string;
    value: string;
    iconKey: 'income' | 'subscriptions' | 'transactions' | 'totalEarned';
}
