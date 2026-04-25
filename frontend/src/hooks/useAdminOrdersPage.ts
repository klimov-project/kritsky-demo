import { useEffect, useMemo, useState } from 'react';

import { loadAdminOrders } from '@/lib/api/adminOrders';
import type { AdminOrder } from '@/types/admin';

export const useAdminOrdersPage = () => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await loadAdminOrders(page);
                if (!cancelled) {
                    setOrders(response.items);
                    setTotalPages(response.totalPages);
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
    }, [page]);

    const pageData = orders;
    const currentPage = page;

    return {
        isLoading,
        error,
        pageData,
        currentPage,
        totalPages,
        handlePageChange: setPage,
    };
};
