import type { FormEventHandler } from 'react';

export type AuthTab = 'login' | 'register';

export interface LoginAuthCardProps {
    activeTab: AuthTab;
    name: string;
    email: string;
    password: string;
    error: string;
    isSubmitting: boolean;
    onNameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onPhoneAuthClick: () => void;
    onTelegramAuthClick: () => void;
    onToggleTab: () => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onClose?: () => void;
}
