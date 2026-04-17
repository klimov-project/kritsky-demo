import { useEffect, useMemo, useState } from 'react';

import { loadAdminDashboard } from '@/lib/api/adminDashboard';
import type { AdminDashboardStats } from '@/types/admin';
import {
    ADMIN_DASHBOARD_QUICK_LINKS,
    buildAdminDashboardMetricCards,
    EMPTY_ADMIN_DASHBOARD_STATS,
} from '@/utils/adminDashboard';

export const useAdminDashboardPage = () => {
    const [stats, setStats] = useState<AdminDashboardStats>(EMPTY_ADMIN_DASHBOARD_STATS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await loadAdminDashboard();
                if (!cancelled) {
                    setStats(response.stats);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить дашборд');
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

    const cards = useMemo(() => buildAdminDashboardMetricCards(stats), [stats]);

    return {
        isLoading,
        error,
        cards,
        quickLinks: ADMIN_DASHBOARD_QUICK_LINKS,
    };
};
