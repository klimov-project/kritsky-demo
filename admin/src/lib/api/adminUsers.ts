import { listAdminUsers } from '@/lib/adminApi';
import type { AdminUsersLoadResult } from '@/types/api/adminUsers';

export const loadAdminUsers = async (): Promise<AdminUsersLoadResult> => {
    const users = await listAdminUsers();
    return { users };
};
