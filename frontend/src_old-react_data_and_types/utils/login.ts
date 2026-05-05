import type { AuthRole } from '@/lib/authApi';
import { LOGIN_DEFAULT_ERROR_MESSAGE } from '@/consts/utils/login';
import type { AuthTab } from '@/types/ui/login';

export { LOGIN_DEFAULT_ERROR_MESSAGE };

export const getAuthUnavailablePhoneMessage = (activeTab: AuthTab): string => {
    return activeTab === 'login'
        ? 'Пока доступен только вход по e-mail.'
        : 'Регистрация по номеру пока недоступна.';
};

export const getAuthUnavailableTelegramMessage = (activeTab: AuthTab): string => {
    return activeTab === 'login'
        ? 'Вход через Telegram пока недоступен.'
        : 'Регистрация через Telegram пока недоступна.';
};

export const getAuthPageTitle = (activeTab: AuthTab): string => {
    return activeTab === 'login' ? 'Вход в аккаунт' : 'Регистрация';
};

export const getAuthSubmitLabel = (activeTab: AuthTab, isSubmitting: boolean): string => {
    if (isSubmitting) return 'Подождите...';
    return activeTab === 'login' ? 'Войти' : 'Создать аккаунт';
};

export const getAuthPhoneButtonLabel = (activeTab: AuthTab): string => {
    return activeTab === 'login' ? 'Войти по номеру' : 'Регистрация по номеру';
};

export const getAuthTelegramButtonLabel = (activeTab: AuthTab): string => {
    return activeTab === 'login' ? 'Войти в Telegram' : 'Регистрация через Telegram';
};

export const getAuthTabToggleLabel = (activeTab: AuthTab): string => {
    return activeTab === 'login' ? 'У меня нет аккаунта' : 'У меня есть аккаунт';
};

export const getAuthErrorMessage = (errorValue: unknown): string => {
    return errorValue instanceof Error ? errorValue.message : LOGIN_DEFAULT_ERROR_MESSAGE;
};

export const getPostAuthRoute = (role: AuthRole): string => {
    return role === 'admin' ? '/admin' : '/profile';
};

export const toggleAuthTab = (activeTab: AuthTab): AuthTab => {
    return activeTab === 'login' ? 'register' : 'login';
};
