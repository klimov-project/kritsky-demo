import {
    ADMIN_LOGIN_DEFAULT_ERROR,
    ADMIN_LOGIN_NO_ACCESS_ERROR,
} from '@/consts/utils/adminLogin';
import type { AuthUser } from '@/lib/authApi';

export { ADMIN_LOGIN_NO_ACCESS_ERROR, ADMIN_LOGIN_DEFAULT_ERROR };

export const isAdminAuthUser = (user: AuthUser): boolean => user.role === 'admin';

export const getAdminLoginErrorMessage = (errorValue: unknown): string => {
    return errorValue instanceof Error ? errorValue.message : ADMIN_LOGIN_DEFAULT_ERROR;
};
