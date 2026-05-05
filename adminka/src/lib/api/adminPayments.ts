import { getAdminDashboard, listAdminPayments } from '@/lib/adminApi';
import type { AdminPaymentsLoadResult } from '@/types/api/adminPayments';

export const loadAdminPaymentsData = async (): Promise<AdminPaymentsLoadResult> => {
    const [payments, dashboard] = await Promise.all([listAdminPayments(), getAdminDashboard()]);

    return {
        payments,
        dashboard,
    };
};
