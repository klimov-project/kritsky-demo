import type { AuthUser } from '@/lib/authApi';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    name?: string;
}

export type LoginExecutor = (email: string, password: string) => Promise<AuthUser>;
export type RegisterExecutor = (payload: RegisterCredentials) => Promise<AuthUser>;
