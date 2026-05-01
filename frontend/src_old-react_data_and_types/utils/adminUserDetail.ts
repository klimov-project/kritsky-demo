import {
    ADMIN_USER_COLLECTION_CATEGORY,
    ADMIN_USER_DOWNLOAD_PACK_CATEGORY,
} from '@/consts/utils/adminUserDetail';
import type { AdminUserDetail, AdminUserOrder, AdminUserOrderItem } from '@/types/admin';

export { ADMIN_USER_COLLECTION_CATEGORY, ADMIN_USER_DOWNLOAD_PACK_CATEGORY };

export const getAdminUserDetailErrorMessage = (errorValue: unknown, fallback: string): string => {
    if (errorValue instanceof Error && errorValue.message) {
        return errorValue.message;
    }
    return fallback;
};

export const getAdminUserCollectionOrders = (user: AdminUserDetail | null): AdminUserOrder[] => {
    if (!user?.orders) return [];

    return user.orders.filter((order) =>
        order.items.some((item) => item.category === ADMIN_USER_COLLECTION_CATEGORY),
    );
};

export const getAdminUserDownloadPackOrders = (user: AdminUserDetail | null): AdminUserOrder[] => {
    if (!user?.orders) return [];

    return user.orders.filter((order) =>
        order.items.some((item) => item.category === ADMIN_USER_DOWNLOAD_PACK_CATEGORY),
    );
};

export const getAdminUserOrderItemsByCategory = (
    order: AdminUserOrder,
    category: string,
): AdminUserOrderItem[] => {
    return order.items.filter((item) => item.category === category);
};

export const calculateDaysUntilDate = (dateValue: string): number => {
    const targetDate = new Date(dateValue);
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const parseNonNegativeCredits = (value: string): number | null => {
    const credits = Number.parseInt(value, 10);
    if (Number.isNaN(credits) || credits < 0) {
        return null;
    }
    return credits;
};

export const getTodayIsoDate = (): string => {
    return new Date().toISOString().split('T')[0];
};
