'use client';

import LoginAuthCard from '@/components/login/LoginAuthCard';
import PageLayout from '@/components/layout/PageLayout';
import { useLoginPage } from '@/hooks/useLoginPage';

export default function LoginPage() {
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
    } = useLoginPage();

    if (isLoading) return null;

    return (
        <PageLayout bodyClassName="bg-[#F5F3F1]">
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
            />
        </PageLayout>
    );
}
