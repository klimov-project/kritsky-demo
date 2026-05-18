'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import AdminLoginCard from '@/components/admin/login/AdminLoginCard';
import LoginAuthCard from '@/components/login/LoginAuthCard';
import FeedbackPopup from '@/components/shared/FeedbackPopup';
import { useAdminLoginPage } from '@/hooks/useAdminLoginPage';
import { useLoginPage } from '@/hooks/useLoginPage';
import type { AuthTab } from '@/types/ui/login';

function AuthModalEntry({ initialTab, onClose }: { initialTab: AuthTab; onClose: () => void }) {
    const {
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
    } = useLoginPage(initialTab);

    if (isLoading) return null;

    return (
        <LoginAuthCard
            activeTab={activeTab}
            name={name}
            email={email}
            password={password}
            error={error}
            isSubmitting={isSubmitting}
            onNameChange={setName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onPhoneAuthClick={handlePhoneAuthClick}
            onTelegramAuthClick={handleTelegramAuthClick}
            onToggleTab={handleToggleTab}
            onSubmit={handleSubmit}
            onClose={onClose}
        />
    );
}

function AdminLoginModalEntry({ onClose }: { onClose: () => void }) {
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
            onClose={onClose}
        />
    );
}

export default function GlobalModals() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const modalName = searchParams.get('modal');

    const closeModal = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('modal');
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    if (modalName === 'login' || modalName === 'register') {
        return <AuthModalEntry initialTab={modalName === 'register' ? 'register' : 'login'} onClose={closeModal} />;
    }

    if (modalName === 'admin-login') {
        return <AdminLoginModalEntry onClose={closeModal} />;
    }

    if (modalName === 'feedback') {
        return <FeedbackPopup isOpen onClose={closeModal} />;
    }

    return null;
}
