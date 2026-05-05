import type { AuthUser } from '@/lib/authApi';
import type { AdminLoginCredentials, AdminLoginExecutor } from '@/types/api/adminLogin';

export const executeAdminLogin = async (
    executor: AdminLoginExecutor,
    credentials: AdminLoginCredentials,
): Promise<AuthUser> => {
    return executor(credentials.login, credentials.password);
};
