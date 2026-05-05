import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/consts/lib/authStorage';

interface StoredTokens {
    accessToken: string;
    refreshToken: string;
}

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getAccessToken = (): string | null => {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (tokens: StoredTokens): void => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const clearTokens = (): void => {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};
