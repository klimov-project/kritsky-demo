import { clearTokens, setTokens } from '@/lib/authStorage';
import { requestJson, requestJsonAuth } from '@/lib/http';

export type AuthRole = 'user' | 'admin';

export interface AuthUser {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: AuthRole;
    isPro: boolean;
    isBlocked: boolean;
}

interface AuthTokensResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: AuthUser;
}

interface LoginPayload {
    email: string;
    password: string;
}

interface RegisterPayload {
    email: string;
    password: string;
    name?: string;
}

interface AdminLoginPayload {
    login: string;
    password: string;
}

interface UpdateProfilePayload {
    name?: string;
    email?: string;
    phone?: string;
}

interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

const persistAuthResponse = (response: AuthTokensResponse): AuthUser => {
    setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
    });
    return response.user;
};

export const clearAuthSession = () => {
    clearTokens();
};

export const loginWithEmail = async (payload: LoginPayload): Promise<AuthUser> => {
    const response = await requestJson<AuthTokensResponse>('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return persistAuthResponse(response);
};

export const registerWithEmail = async (payload: RegisterPayload): Promise<AuthUser> => {
    const response = await requestJson<AuthTokensResponse>('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return persistAuthResponse(response);
};

export const loginAdmin = async (payload: AdminLoginPayload): Promise<AuthUser> => {
    const response = await requestJson<AuthTokensResponse>('/api/auth/admin/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return persistAuthResponse(response);
};

export const getCurrentUser = async (): Promise<AuthUser> => {
    return requestJsonAuth<AuthUser>('/api/auth/me');
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<AuthUser> => {
    return requestJsonAuth<AuthUser>('/api/auth/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
    await requestJsonAuth<{ ok: boolean }>('/api/auth/change-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
};

