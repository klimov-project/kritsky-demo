import { getAdminDashboard, listAdminPayments } from '@/lib/adminApi';
import type { AdminPaymentsLoadResult } from '@/types/api/adminPayments';

export const loadAdminPaymentsData = async (page = 1, pageSize = 25): Promise<any> => {
    const [paymentsResponse, dashboard] = await Promise.all([
        listAdminPayments(page, pageSize), 
        getAdminDashboard()
    ]);

    return {
        payments: paymentsResponse.items,
        total: paymentsResponse.total,
        totalPages: paymentsResponse.totalPages,
        dashboard,
    };
};
