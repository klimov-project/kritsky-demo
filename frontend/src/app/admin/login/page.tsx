'use client';

import AdminLoginCard from '@/components/admin/login/AdminLoginCard';
import { useAdminLoginPage } from '@/hooks/useAdminLoginPage';

export default function AdminLoginPage() {
    const {
        isLoading,
        loginValue,
        password,
        error,
        isSubmitting,
        setLoginValue,
        setPassword,
        handleLogin,
    } = useAdminLoginPage();

    if (isLoading) return null;

    return (
        <AdminLoginCard
            loginValue={loginValue}
            password={password}
            error={error}
            isSubmitting={isSubmitting}
            onLoginValueChange={setLoginValue}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
        />
    );
}
