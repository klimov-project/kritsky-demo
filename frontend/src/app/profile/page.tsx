'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoCloudDownloadOutline, IoFlashOutline, IoReceiptOutline, IoTimeOutline } from 'react-icons/io5';

import PageLayout from '@/components/layout/PageLayout';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';
import { useAuth } from '@/context/AuthContext';
import { getVariantExportQuota, type VariantExportQuota } from '@/lib/variantsApi';

const EMPTY_QUOTA: VariantExportQuota = {
    hasActiveSubscription: false,
    dailyFreeLimit: 0,
    dailyFreeUsed: 0,
    dailyFreeRemaining: 0,
    paidDownloadsRemaining: 0,
};

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading, logout, updateProfile, changePassword } = useAuth();

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
    const [quota, setQuota] = useState<VariantExportQuota>(EMPTY_QUOTA);
    const [isLoadingQuota, setIsLoadingQuota] = useState(true);
    const [quotaError, setQuotaError] = useState('');

    useEffect(() => {
        if (isLoading) return;
        if (!user || user.role !== 'user') {
            router.push('/login');
            return;
        }

        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
    }, [isLoading, router, user]);

    useEffect(() => {
        if (isLoading || !user || user.role !== 'user') return;

        let cancelled = false;

        const loadQuota = async () => {
            setIsLoadingQuota(true);
            setQuotaError('');
            try {
                const nextQuota = await getVariantExportQuota();
                if (!cancelled) {
                    setQuota(nextQuota);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setQuota(EMPTY_QUOTA);
                    setQuotaError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить лимиты скачивания');
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingQuota(false);
                }
            }
        };

        void loadQuota();

        return () => {
            cancelled = true;
        };
    }, [isLoading, user]);

    const handleProfileSave = async () => {
        setProfileError('');
        setProfileMessage('');
        setIsSavingProfile(true);

        try {
            await updateProfile({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
            });
            setProfileMessage('Профиль обновлён');
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
            setPasswordMessage('Пароль изменён');
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordRepeat('');
        } catch (errorValue) {
            setPasswordError(errorValue instanceof Error ? errorValue.message : 'Не удалось изменить пароль');
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (isLoading || !user || user.role !== 'user') return null;

    return (
        <PageLayout hideHeader={false} hideFooter={false}>
            <div className="w-full max-w-[1200px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
                <div className="max-w-[680px] flex flex-col gap-8">
                    <div>
                        <h1 className="font-serif text-4xl font-bold text-[#221E20]">Профиль</h1>
                        <p className="text-[#221E20]/60 mt-2">Управление персональными данными и безопасностью аккаунта.</p>
                    </div>

                    <section className="bg-white border border-[#221E20]/10 rounded-xl p-6 space-y-5">
                        <div className="flex flex-col gap-1">
                            <h2 className="font-serif font-bold text-2xl">Подписка и скачивания</h2>
                            <p className="text-sm text-[#221E20]/60">
                                Здесь собраны быстрые переходы к тарифу, пакетам скачиваний и истории покупок.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-xl border border-[#221E20]/10 bg-[#faf7ef] p-4">
                                <div className="flex items-center gap-2 text-[#221E20]/55 text-xs uppercase tracking-[0.18em]">
                                    <IoFlashOutline size={16} />
                                    Подписка
                                </div>
                                <div className="mt-3 font-serif text-2xl font-bold text-[#221E20]">
                                    {user.isPro || quota.hasActiveSubscription ? 'Активна' : 'Не активна'}
                                </div>
                                <div className="mt-2 text-sm text-[#221E20]/60">
                                    {user.isPro || quota.hasActiveSubscription
                                        ? 'Генерации без лимита, 3 бесплатных скачивания или распечатки в день.'
                                        : 'Без подписки доступны только купленные пакеты скачиваний.'}
                                </div>
                            </div>

                            <div className="rounded-xl border border-[#221E20]/10 bg-[#faf7ef] p-4">
                                <div className="flex items-center gap-2 text-[#221E20]/55 text-xs uppercase tracking-[0.18em]">
                                    <IoTimeOutline size={16} />
                                    На сегодня
                                </div>
                                <div className="mt-3 font-serif text-2xl font-bold text-[#221E20]">
                                    {isLoadingQuota ? '...' : `${quota.dailyFreeRemaining} / ${quota.dailyFreeLimit}`}
                                </div>
                                <div className="mt-2 text-sm text-[#221E20]/60">
                                    Бесплатные скачивания и распечатки по подписке на текущий день.
                                </div>
                            </div>

                            <div className="rounded-xl border border-[#221E20]/10 bg-[#faf7ef] p-4">
                                <div className="flex items-center gap-2 text-[#221E20]/55 text-xs uppercase tracking-[0.18em]">
                                    <IoCloudDownloadOutline size={16} />
                                    Купленные пакеты
                                </div>
                                <div className="mt-3 font-serif text-2xl font-bold text-[#221E20]">
                                    {isLoadingQuota ? '...' : quota.paidDownloadsRemaining}
                                </div>
                                <div className="mt-2 text-sm text-[#221E20]/60">
                                    Постоянный остаток дополнительных скачиваний и распечаток.
                                </div>
                            </div>
                        </div>

                        {quotaError && <div className="text-sm text-red-600">{quotaError}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button variant="filled" className="w-full" onClick={() => router.push('/profile/tariff')}>
                                Купить тариф
                            </Button>
                            <Button variant="outlined" className="w-full" onClick={() => router.push('/profile/download-packs')}>
                                Докупить скачивания и распечатывания
                            </Button>
                            <Button variant="outlined" className="w-full" onClick={() => router.push('/profile/tariff-history')}>
                                История оплат тарифа
                            </Button>
                            <Button variant="outlined" className="w-full" onClick={() => router.push('/profile/download-history')}>
                                История скачиваний и распечатываний
                            </Button>
                        </div>

                        <div className="flex items-start gap-2 rounded-xl border border-[#221E20]/10 bg-[#221E20]/[0.03] px-4 py-3 text-sm text-[#221E20]/70">
                            <IoReceiptOutline size={16} className="shrink-0 mt-0.5" />
                            <span>
                                Если у вас уже есть активная подписка и купленные пакеты, сначала расходуются 3 ежедневных бесплатных скачивания, затем платные.
                            </span>
                        </div>
                    </section>

                    <section className="bg-white border border-[#221E20]/10 rounded-xl p-6 space-y-4">
                        <h2 className="font-serif font-bold text-2xl">Личные данные</h2>
                        <Input label="Имя" value={name} onChange={(event) => setName(event.target.value)} width="full" />
                        <Input label="Email" value={email} onChange={(event) => setEmail(event.target.value)} width="full" />
                        <Input label="Телефон" value={phone} onChange={(event) => setPhone(event.target.value)} width="full" />
                        {profileError && <div className="text-sm text-red-600">{profileError}</div>}
                        {profileMessage && <div className="text-sm text-green-700">{profileMessage}</div>}
                        <div className="flex justify-end">
                            <Button variant="outlined" className="bg-black/5" onClick={handleProfileSave} disabled={isSavingProfile}>
                                {isSavingProfile ? 'Сохраняю...' : 'Сохранить профиль'}
                            </Button>
                        </div>
                    </section>

                    <section className="bg-white border border-[#221E20]/10 rounded-xl p-6 space-y-4">
                        <h2 className="font-serif font-bold text-2xl">Смена пароля</h2>
                        <Input
                            label="Текущий пароль"
                            type="password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            width="full"
                        />
                        <Input
                            label="Новый пароль"
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            width="full"
                        />
                        <Input
                            label="Повторите новый пароль"
                            type="password"
                            value={newPasswordRepeat}
                            onChange={(event) => setNewPasswordRepeat(event.target.value)}
                            width="full"
                        />
                        {passwordError && <div className="text-sm text-red-600">{passwordError}</div>}
                        {passwordMessage && <div className="text-sm text-green-700">{passwordMessage}</div>}
                        <div className="flex justify-end">
                            <Button variant="outlined" className="bg-black/5" onClick={handlePasswordSave} disabled={isSavingPassword}>
                                {isSavingPassword ? 'Сохраняю...' : 'Сменить пароль'}
                            </Button>
                        </div>
                    </section>

                    <div className="flex justify-end">
                        <Button
                            variant="outlined"
                            className="!border-red-200 !text-red-500 hover:!bg-red-50"
                            onClick={() => logout('/')}
                        >
                            Выйти из профиля
                        </Button>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
