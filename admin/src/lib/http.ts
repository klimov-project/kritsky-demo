import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/authStorage';

const resolveApiUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim() || '';
    return base.endsWith('/') ? base.slice(0, -1) : base;
};

const buildUrl = (path: string) => `${resolveApiUrl()}${path.startsWith('/') ? path : `/${path}`}`;

const getValidationErrorMessage = (detail: unknown): string | null => {
    if (!Array.isArray(detail) || detail.length === 0) {
        return null;
    }

    const firstIssue = detail[0];
    if (!firstIssue || typeof firstIssue !== 'object') {
        return null;
    }

    const issue = firstIssue as {
        loc?: unknown;
        msg?: unknown;
        type?: unknown;
    };
    const loc = Array.isArray(issue.loc) ? issue.loc : [];
    const field = typeof loc[loc.length - 1] === 'string' ? loc[loc.length - 1] : '';
    const msg = typeof issue.msg === 'string' ? issue.msg : '';

    if (field === 'email') {
        return 'Введите корректный email, например example@mail.com';
    }
    if (field === 'name' && String(issue.type).includes('too_long')) {
        return 'Имя не должно превышать 255 символов';
    }
    if (field === 'phone') {
        return msg || 'Введите телефон в формате +7 999 123 45 67';
    }
    if (field === 'oldPassword' || field === 'currentPassword') {
        return 'Введите текущий пароль';
    }
    if (field === 'newPassword') {
        return msg || 'Новый пароль должен содержать минимум 6 символов';
    }

    return msg || null;
};

const tryParseErrorMessage = async (response: Response) => {
    try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await response.json();
            if (typeof data?.detail === 'string') {
                return data.detail;
            }
            const validationMessage = getValidationErrorMessage(data?.detail);
            if (validationMessage) {
                return validationMessage;
            }
            if (typeof data?.message === 'string') {
                return data.message;
            }
            return JSON.stringify(data);
        }

        const text = await response.text();
        return text || `HTTP ${response.status}`;
    } catch {
        return `HTTP ${response.status}`;
    }
};

export const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(buildUrl(path), {
        ...init,
        headers: {
            Accept: 'application/json',
            ...(init?.headers || {}),
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        const errorMessage = await tryParseErrorMessage(response);
        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return null as T;
    }

    return response.json() as Promise<T>;
};

const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return false;
    }

    const response = await fetch(buildUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
    });

    if (!response.ok) {
        clearTokens();
        return false;
    }

    const payload = await response.json();
    if (typeof payload?.accessToken !== 'string' || typeof payload?.refreshToken !== 'string') {
        clearTokens();
        return false;
    }

    setTokens({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
    });
    return true;
};

export const requestJsonAuth = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const execute = async (): Promise<Response> => {
        let accessToken = getAccessToken();
        if (!accessToken) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                throw new Error('Требуется авторизация');
            }
            accessToken = getAccessToken();
        }

        if (!accessToken) {
            throw new Error('Требуется авторизация');
        }

        return fetch(buildUrl(path), {
            ...init,
            headers: {
                Accept: 'application/json',
                ...(init?.headers || {}),
                Authorization: `Bearer ${accessToken}`,
            },
            cache: 'no-store',
        });
    };

    let response = await execute();

    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
            throw new Error('Сессия истекла. Войдите снова.');
        }
        response = await execute();
    }

    if (!response.ok) {
        const errorMessage = await tryParseErrorMessage(response);
        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return null as T;
    }

    return response.json() as Promise<T>;
};
