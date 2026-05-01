import type { AdminOrder, AdminOrderStatus } from '@/types/admin';
import {
    ADMIN_ORDER_ACTION_OPTIONS,
    ADMIN_ORDERS_PAGE_SIZE,
} from '@/consts/utils/adminOrders';

export { ADMIN_ORDERS_PAGE_SIZE, ADMIN_ORDER_ACTION_OPTIONS };

export const paginateAdminOrders = (
    orders: AdminOrder[],
    page: number,
    pageSize = ADMIN_ORDERS_PAGE_SIZE,
) => {
    const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageData = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return {
        totalPages,
        currentPage,
        pageData,
    };
};

export const getAdminOrderStatusLabel = (status: AdminOrderStatus): string => {
    if (status === 'Paid') return 'Оплачен';
    if (status === 'New') return 'Новый';
    if (status === 'Cancelled') return 'Отклонен';
    return 'Доставлен';
};

export const getAdminOrderStatusClassName = (status: AdminOrderStatus): string => {
    if (status === 'Paid') return 'bg-green-100 text-green-700';
    if (status === 'New') return 'bg-blue-100 text-blue-700';
    if (status === 'Cancelled') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
};
