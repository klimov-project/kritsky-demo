import { EMPTY_ADMIN_DASHBOARD_STATS } from '@/consts/utils/adminDashboard';
import { ADMIN_PAYMENTS_PAGE_SIZE } from '@/consts/utils/adminPayments';
import type { AdminPayment, AdminPaymentStatus } from '@/types/admin';
import type { AdminPaymentStatCard } from '@/types/api/adminPayments';

export { ADMIN_PAYMENTS_PAGE_SIZE, EMPTY_ADMIN_DASHBOARD_STATS };

export const calculateAdminPaymentsPeriodIncome = (payments: AdminPayment[]): number => {
    return payments
        .filter((payment) => payment.status === 'Success')
        .reduce((sum, payment) => sum + payment.amount, 0);
};

export const paginateAdminPayments = (
    payments: AdminPayment[],
    page: number,
    pageSize = ADMIN_PAYMENTS_PAGE_SIZE,
) => {
    const totalPages = Math.max(1, Math.ceil(payments.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageData = payments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return {
        totalPages,
        currentPage,
        pageData,
    };
};

export const getAdminPaymentStatusLabel = (status: AdminPaymentStatus): string => {
    if (status === 'Success') return 'Успешно';
    if (status === 'Pending') return 'В обработке';
    return 'Ошибка';
};

export const getAdminPaymentStatusClassName = (status: AdminPaymentStatus): string => {
    if (status === 'Success') return 'text-green-600';
    if (status === 'Pending') return 'text-orange-500';
    return 'text-red-500';
};

interface BuildAdminPaymentCardsParams {
    periodIncome: number;
    subscriptionsCount: number;
    paymentsCount: number;
    totalEarned: number;
}

export const buildAdminPaymentStatCards = ({
    periodIncome,
    subscriptionsCount,
    paymentsCount,
    totalEarned,
}: BuildAdminPaymentCardsParams): AdminPaymentStatCard[] => {
    return [
        {
            label: 'Доход за период',
            value: `${periodIncome.toLocaleString('ru-RU')} ₽`,
            iconKey: 'income',
        },
        {
            label: 'Активных подписок',
            value: `${subscriptionsCount}`,
            iconKey: 'subscriptions',
        },
        {
            label: 'Всего транзакций',
            value: `${paymentsCount}`,
            iconKey: 'transactions',
        },
        {
            label: 'Заработано всего',
            value: `${totalEarned.toLocaleString('ru-RU')} ₽`,
            iconKey: 'totalEarned',
        },
    ];
};
