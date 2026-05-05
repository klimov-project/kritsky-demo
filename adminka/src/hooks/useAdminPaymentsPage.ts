import { useEffect, useMemo, useState } from 'react';

import { loadAdminPaymentsData } from '@/lib/api/adminPayments';
import type { AdminDashboardStats, AdminPayment } from '@/types/admin';
import {
    buildAdminPaymentStatCards,
    calculateAdminPaymentsPeriodIncome,
    EMPTY_ADMIN_DASHBOARD_STATS,
    paginateAdminPayments,
} from '@/utils/adminPayments';

export const useAdminPaymentsPage = () => {
    const [payments, setPayments] = useState<AdminPayment[]>([]);
    const [dashboard, setDashboard] = useState<AdminDashboardStats>(EMPTY_ADMIN_DASHBOARD_STATS);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError('');

            try {
                const response = await loadAdminPaymentsData();
                if (!cancelled) {
                    setPayments(response.payments);
                    setDashboard(response.dashboard);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить оплаты');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const { totalPages, currentPage, pageData } = useMemo(
        () => paginateAdminPayments(payments, page),
        [payments, page],
    );

    const periodIncome = useMemo(() => calculateAdminPaymentsPeriodIncome(payments), [payments]);

    const statsCards = useMemo(
        () =>
            buildAdminPaymentStatCards({
                periodIncome,
                subscriptionsCount: dashboard.subscriptionsCount,
                paymentsCount: payments.length,
                totalEarned: dashboard.totalEarned,
            }),
        [dashboard.subscriptionsCount, dashboard.totalEarned, payments.length, periodIncome],
    );

    return {
        isLoading,
        error,
        pageData,
        currentPage,
        totalPages,
        statsCards,
        handlePageChange: setPage,
    };
};
