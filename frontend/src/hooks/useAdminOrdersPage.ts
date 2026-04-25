import { useEffect, useMemo, useState } from 'react';

import { loadAdminOrders } from '@/lib/api/adminOrders';
import type { AdminOrder } from '@/types/admin';
import { paginateAdminOrders } from '@/utils/adminOrders';

export const useAdminOrdersPage = () => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await loadAdminOrders();
                if (!cancelled) {
                    setOrders(response.orders);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить заказы');
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
        () => paginateAdminOrders(orders, page),
        [orders, page],
    );

    return {
        isLoading,
        error,
        pageData,
        currentPage,
        totalPages,
        handlePageChange: setPage,
    };
};
