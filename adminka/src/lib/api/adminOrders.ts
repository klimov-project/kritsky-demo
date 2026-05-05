import { listAdminOrders } from '@/lib/adminApi';
import type { AdminOrdersLoadResult } from '@/types/api/adminOrders';

export const loadAdminOrders = async (): Promise<AdminOrdersLoadResult> => {
    const orders = await listAdminOrders();
    return { orders };
};
