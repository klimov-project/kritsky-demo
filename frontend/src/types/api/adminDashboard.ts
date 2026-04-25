import type { AdminDashboardStats } from '@/types/admin';

export interface AdminDashboardLoadResult {
    stats: AdminDashboardStats;
}

export interface AdminDashboardMetricCard {
    title: string;
    value: number;
    iconKey: 'subscriptions' | 'users' | 'generated' | 'downloads';
}
