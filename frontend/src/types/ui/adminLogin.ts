import type { FormEventHandler } from 'react';

export interface AdminLoginCardProps {
    loginValue: string;
    password: string;
    error: string;
    isSubmitting: boolean;
    onLoginValueChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
}
