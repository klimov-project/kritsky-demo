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
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

interface AdminPaymentsListResponse {
    items: AdminPayment[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

interface AdminOrdersListResponse {
    items: AdminOrder[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const getAdminDashboard = async (): Promise<AdminDashboardStats> => {
    return requestJsonAuth<AdminDashboardStats>('/api/admin/dashboard');
};

export const listAdminUsers = async (page = 1, pageSize = 25, q = ''): Promise<AdminUsersListResponse> => {
    const query = new URLSearchParams({ 
        page: page.toString(), 
        page_size: pageSize.toString() 
    });
    if (q) query.append('q', q);
    
    return requestJsonAuth<AdminUsersListResponse>(`/api/admin/users?${query.toString()}`);
};

export const listAdminPayments = async (page = 1, pageSize = 25): Promise<AdminPaymentsListResponse> => {
    const query = new URLSearchParams({ 
        page: page.toString(), 
        page_size: pageSize.toString() 
    });
    return requestJsonAuth<AdminPaymentsListResponse>(`/api/admin/payments?${query.toString()}`);
};

export const listAdminOrders = async (page = 1, pageSize = 25): Promise<AdminOrdersListResponse> => {
    const query = new URLSearchParams({ 
        page: page.toString(), 
        page_size: pageSize.toString() 
    });
    return requestJsonAuth<AdminOrdersListResponse>(`/api/admin/orders?${query.toString()}`);
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
