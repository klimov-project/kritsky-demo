import {
    ADMIN_DASHBOARD_QUICK_LINKS,
    EMPTY_ADMIN_DASHBOARD_STATS,
} from '@/consts/utils/adminDashboard';
import type { AdminDashboardMetricCard } from '@/types/api/adminDashboard';
import type { AdminDashboardStats } from '@/types/admin';

export { EMPTY_ADMIN_DASHBOARD_STATS, ADMIN_DASHBOARD_QUICK_LINKS };

export const buildAdminDashboardMetricCards = (
    stats: AdminDashboardStats,
): AdminDashboardMetricCard[] => {
    return [
        {
            title: 'Активных подписок',
            value: stats.subscriptionsCount,
            iconKey: 'subscriptions',
        },
        {
            title: 'Пользователей',
            value: stats.usersCount,
            iconKey: 'users',
        },
        {
            title: 'Сохранено вариантов',
            value: stats.generatedVariantsCount,
            iconKey: 'generated',
        },
        {
            title: 'Скачано вариантов',
            value: stats.downloadedVariantsCount,
            iconKey: 'downloads',
        },
    ];
};
