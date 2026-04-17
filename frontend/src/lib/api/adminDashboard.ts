import { getAdminDashboard } from '@/lib/adminApi';
import type { AdminDashboardLoadResult } from '@/types/api/adminDashboard';

export const loadAdminDashboard = async (): Promise<AdminDashboardLoadResult> => {
    const stats = await getAdminDashboard();
    return { stats };
};
