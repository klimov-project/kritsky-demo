import type { AdminDashboardStats } from '@/types/admin';
import type { AdminDashboardQuickLink } from '@/types/ui/adminDashboard';

export const EMPTY_ADMIN_DASHBOARD_STATS: AdminDashboardStats = {
    subscriptionsCount: 0,
    usersCount: 0,
    generatedVariantsCount: 0,
    downloadedVariantsCount: 0,
    totalEarned: 0,
    ordersCount: 0,
    paymentsCount: 0,
};

export const ADMIN_DASHBOARD_QUICK_LINKS: AdminDashboardQuickLink[] = [
    {
        href: '/admin/users',
        title: 'Пользователи',
        description: 'Активность и статусы подписок',
    },
    {
        href: '/admin/payments',
        title: 'Оплаты',
        description: 'Реестр транзакций из БД',
    },
    {
        href: '/admin/books',
        title: 'Товары',
        description: 'Каталог магазина',
    },
];
