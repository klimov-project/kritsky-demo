'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ProfileCabinetShell } from '@/components/profile/cabinet';
import { ProfilePersonalDataSection } from '@/components/profile/cabinet/sections';
import PageLayout from '@/components/layout/PageLayout';
import { useAuth } from '@/context/AuthContext';
import { useProfileCabinetData } from '@/hooks/useProfileCabinetData';

const MAX_NAME_LENGTH = 255;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatPhoneInput = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) {
        return '';
    }

    let digits = digitsOnly;
    if (digits.startsWith('8')) {
        digits = `7${digits.slice(1)}`;
    }
    if (!digits.startsWith('7')) {
        digits = `7${digits}`;
    }
    digits = digits.slice(0, 11);

    const local = digits.slice(1);
    const parts = [
        local.slice(0, 3),
        local.slice(3, 6),
        local.slice(6, 8),
        local.slice(8, 10),
    ].filter(Boolean);

    return parts.length > 0 ? `+7 ${parts.join(' ')}` : '+7';
};

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading, logout, updateProfile, changePassword } = useAuth();
    const { subscriptionUntilLabel } = useProfileCabinetData();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordRepeat, setNewPasswordRepeat] = useState('');
    const [profileMessage, setProfileMessage] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [profileError, setProfileError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        if (isLoading) {
            return;
        }
        if (!user || user.role !== 'user') {
            router.replace('/?modal=login');
            return;
        }

        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(formatPhoneInput(user.phone || ''));
    }, [isLoading, router, user]);

    const handleProfileSave = async () => {
        setProfileError('');
        setProfileMessage('');
        setIsSavingProfile(true);

        try {
            const trimmedName = name.trim();
            const normalizedEmail = email.trim().toLowerCase();
            const normalizedPhone = phone.replace(/\D/g, '').length <= 1 ? '' : phone.trim();
            if (trimmedName.length > MAX_NAME_LENGTH) {
                throw new Error('Имя не должно превышать 255 символов');
            }
            if (!EMAIL_RE.test(normalizedEmail)) {
                throw new Error('Введите корректный email, например example@mail.com');
            }

            await updateProfile({
                name: trimmedName,
                email: normalizedEmail,
                phone: normalizedPhone,
            });
            setProfileMessage('Данные успешно обновлены');
        } catch (errorValue) {
            setProfileError(errorValue instanceof Error ? errorValue.message : 'Не удалось обновить профиль');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordSave = async () => {
        setPasswordError('');
        setPasswordMessage('');

        if (!currentPassword || !newPassword) {
            setPasswordError('Заполните текущий и новый пароль');
            return;
        }

        if (newPassword !== newPasswordRepeat) {
            setPasswordError('Новый пароль и повтор не совпадают');
            return;
        }

        setIsSavingPassword(true);
        try {
            await changePassword({
                currentPassword,
                newPassword,
            });
            setPasswordMessage('Пароль успешно изменен');
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordRepeat('');
        } catch (errorValue) {
            setPasswordError(errorValue instanceof Error ? errorValue.message : 'Не удалось изменить пароль');
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (isLoading || !user || user.role !== 'user') {
        return null;
    }

    return (
        <PageLayout bodyClassName="index-page">
            <ProfileCabinetShell
                activeSection="personal"
                subscriptionUntilLabel={subscriptionUntilLabel}
                onLogout={() => logout('/?modal=login')}
                showMobileSideCards
            >
                <ProfilePersonalDataSection
                    name={name}
                    email={email}
                    phone={phone}
                    currentPassword={currentPassword}
                    newPassword={newPassword}
                    newPasswordRepeat={newPasswordRepeat}
                    onNameChange={setName}
                    onEmailChange={setEmail}
                    onPhoneChange={(value) => setPhone(formatPhoneInput(value))}
                    onCurrentPasswordChange={setCurrentPassword}
                    onNewPasswordChange={setNewPassword}
                    onNewPasswordRepeatChange={setNewPasswordRepeat}
                    onProfileSave={handleProfileSave}
                    onPasswordSave={handlePasswordSave}
                    isSavingProfile={isSavingProfile}
                    isSavingPassword={isSavingPassword}
                    profileMessage={profileMessage}
                    profileError={profileError}
                    passwordMessage={passwordMessage}
                    passwordError={passwordError}
                />
            </ProfileCabinetShell>
        </PageLayout>
    );
}
