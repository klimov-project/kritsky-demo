import { listAdminUsers } from '@/lib/adminApi';
import type { AdminUsersLoadResult } from '@/types/api/adminUsers';

export const loadAdminUsers = async (page = 1, pageSize = 25, q = ''): Promise<any> => {
    return await listAdminUsers(page, pageSize, q);
};
