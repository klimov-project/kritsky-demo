import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { executeAuthByTab } from '@/lib/api/login';
import type { AuthTab } from '@/types/ui/login';
import {
    getAuthErrorMessage,
    getAuthUnavailablePhoneMessage,
    getAuthUnavailableTelegramMessage,
    getPostAuthRoute,
    toggleAuthTab,
} from '@/utils/login';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useLoginPage = (initialTab: AuthTab = 'login') => {
    const router = useRouter();
    const { user, isLoading, login, register } = useAuth();

    const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isLoading) return;
        if (user) {
            router.replace(getPostAuthRoute(user.role));
        }
    }, [isLoading, router, user]);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        const normalizedEmail = email.trim();
        if (!EMAIL_RE.test(normalizedEmail)) {
            setError('Введите корректный email, например example@mail.com');
            return;
        }

        setIsSubmitting(true);

        try {
            const nextUser = await executeAuthByTab({
                activeTab,
                loginExecutor: login,
                registerExecutor: register,
                loginCredentials: {
                    email: normalizedEmail,
                    password,
                },
                registerCredentials: {
                    email: normalizedEmail,
                    password,
                    name,
                },
            });

            router.push(getPostAuthRoute(nextUser.role));
        } catch (errorValue) {
            setError(getAuthErrorMessage(errorValue));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePhoneAuthClick = () => {
        setError(getAuthUnavailablePhoneMessage(activeTab));
    };

    const handleTelegramAuthClick = () => {
        setError(getAuthUnavailableTelegramMessage(activeTab));
    };

    const handleToggleTab = () => {
        setActiveTab(toggleAuthTab(activeTab));
        setError('');
    };

    return {
        isLoading,
        activeTab,
        name,
        email,
        password,
        error,
        isSubmitting,
        setName,
        setEmail,
        setPassword,
        handleSubmit,
        handlePhoneAuthClick,
        handleTelegramAuthClick,
        handleToggleTab,
    };
};
