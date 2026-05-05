import type { AuthUser } from '@/lib/authApi';

export interface AdminLoginCredentials {
    login: string;
    password: string;
}

export type AdminLoginExecutor = (login: string, password: string) => Promise<AuthUser>;
