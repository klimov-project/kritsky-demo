import { listAdminOrders } from '@/lib/adminApi';
import type { AdminOrdersLoadResult } from '@/types/api/adminOrders';

export const loadAdminOrders = async (page = 1, pageSize = 25): Promise<any> => {
    return await listAdminOrders(page, pageSize);
};
