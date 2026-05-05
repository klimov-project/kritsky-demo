import type { AdminDashboardMetricCard } from '@/types/api/adminDashboard';

export interface AdminDashboardMetricsProps {
    cards: AdminDashboardMetricCard[];
}

export interface AdminDashboardQuickLink {
    href: string;
    title: string;
    description: string;
}

export interface AdminDashboardQuickLinksProps {
    links: AdminDashboardQuickLink[];
}
