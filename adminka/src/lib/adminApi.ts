import { requestJsonAuth } from '@/lib/http';
import type {
    AdminDashboardStats,
    AdminOrder,
    AdminPayment,
    AdminUser,
    AdminUserDetail,
} from '@/types/admin';

interface AdminUsersListResponse {
    items: AdminUser[];
}

interface AdminPaymentsListResponse {
    items: AdminPayment[];
}

interface AdminOrdersListResponse {
    items: AdminOrder[];
}

export const getAdminDashboard = async (): Promise<AdminDashboardStats> => {
    return requestJsonAuth<AdminDashboardStats>('/api/admin/dashboard');
};

export const listAdminUsers = async (): Promise<AdminUser[]> => {
    const response = await requestJsonAuth<AdminUsersListResponse>('/api/admin/users');
    return response.items;
};

export const listAdminPayments = async (): Promise<AdminPayment[]> => {
    const response = await requestJsonAuth<AdminPaymentsListResponse>('/api/admin/payments');
    return response.items;
};

export const listAdminOrders = async (): Promise<AdminOrder[]> => {
    const response = await requestJsonAuth<AdminOrdersListResponse>('/api/admin/orders');
    return response.items;
};

export const getAdminUser = async (userId: number): Promise<AdminUserDetail> => {
    return requestJsonAuth<AdminUserDetail>(`/api/admin/users/${userId}`);
};

export const setAdminUserBlockStatus = async (userId: number, block: boolean): Promise<void> => {
    await requestJsonAuth(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block }),
    });
};

export const adminActivateSubscription = async (userId: number, days: number): Promise<{ expireDate: string }> => {
    return requestJsonAuth(`/api/admin/users/${userId}/subscription/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
    });
};

export const adminDeactivateSubscription = async (userId: number): Promise<void> => {
    await requestJsonAuth(`/api/admin/users/${userId}/subscription/deactivate`, {
        method: 'POST',
    });
};

export const adminSetDownloadCredits = async (userId: number, credits: number): Promise<void> => {
    await requestJsonAuth(`/api/admin/users/${userId}/download-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits }),
    });
};

export const getAdminSavedVariant = async (variantId: number): Promise<any> => {
    return requestJsonAuth(`/api/admin/variants/${variantId}`);
};

export const updateAdminSavedVariant = async (variantId: number, payload: any): Promise<any> => {
    return requestJsonAuth(`/api/admin/variants/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
};
