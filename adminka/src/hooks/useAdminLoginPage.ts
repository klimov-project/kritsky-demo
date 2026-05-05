import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { executeAdminLogin } from '@/lib/api/adminLogin';
import {
    ADMIN_LOGIN_NO_ACCESS_ERROR,
    getAdminLoginErrorMessage,
    isAdminAuthUser,
} from '@/utils/adminLogin';

export const useAdminLoginPage = () => {
    const router = useRouter();
    const { user, isLoading, adminLogin } = useAuth();

    const [loginValue, setLoginValue] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isLoading) return;
        if (user?.role === 'admin') {
            router.replace('/admin');
        }
    }, [isLoading, router, user]);

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const nextUser = await executeAdminLogin(adminLogin, {
                login: loginValue,
                password,
            });

            if (!isAdminAuthUser(nextUser)) {
                setError(ADMIN_LOGIN_NO_ACCESS_ERROR);
                return;
            }

            router.push('/admin');
        } catch (errorValue) {
            setError(getAdminLoginErrorMessage(errorValue));
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        isLoading,
        loginValue,
        password,
        error,
        isSubmitting,
        setLoginValue,
        setPassword,
        handleLogin,
    };
};
