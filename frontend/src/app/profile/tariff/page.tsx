'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import PageLayout from '@/components/layout/PageLayout';
import Button from '@/components/shared/Button';
import { useAuth } from '@/context/AuthContext';
import { listPaymentHistory } from '@/lib/shopApi';
import { getVariantExportQuota, type VariantExportQuota } from '@/lib/variantsApi';

const EMPTY_QUOTA: VariantExportQuota = {
    hasActiveSubscription: false,
    dailyFreeLimit: 0,
    dailyFreeUsed: 0,
    dailyFreeRemaining: 0,
    paidDownloadsRemaining: 0,
};

const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

export default function TariffPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    const [quota, setQuota] = useState<VariantExportQuota>(EMPTY_QUOTA);
    const [historyCount, setHistoryCount] = useState(0);
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    useEffect(() => {
        if (isLoading) return;
        if (!user || user.role !== 'user') {
            router.replace('/login');
        }
    }, [isLoading, router, user]);

    useEffect(() => {
        if (isLoading || !user || user.role !== 'user') return;

        let cancelled = false;
        const load = async () => {
            setIsLoadingPage(true);
            setError('');
            try {
                const [nextQuota, payments] = await Promise.all([
                    getVariantExportQuota(),
                    listPaymentHistory(),
                ]);
                if (cancelled) return;
                setQuota(nextQuota);
                setHistoryCount(payments.filter((item) => item.kind === 'subscription').length);
            } catch (errorValue) {
                if (!cancelled) {
                    setQuota(EMPTY_QUOTA);
                    setHistoryCount(0);
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить страницу тарифа');
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingPage(false);
                }
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [isLoading, user]);

    const subscriptionLabel = useMemo(
        () => (user?.isPro || quota.hasActiveSubscription ? 'Активна' : 'Не активна'),
        [quota.hasActiveSubscription, user?.isPro],
    );

    if (isLoading || !user || user.role !== 'user') return null;

    return (
        <PageLayout>
            <div className="w-full max-w-[1200px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
                <div className="max-w-[760px] space-y-6">
                    <div>
                        <h1 className="font-serif text-4xl font-bold text-[#221E20]">Тариф</h1>
                        <p className="mt-2 text-[#221E20]/60">
                            Отдельная страница подписки. Здесь можно оформить тариф и увидеть его текущий статус.
                        </p>
                    </div>

                    <section className="rounded-xl border border-[#221E20]/10 bg-white p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-xl border border-[#221E20]/10 bg-[#faf7ef] p-4">
                                <div className="text-xs uppercase tracking-[0.18em] text-[#221E20]/55">Статус</div>
                                <div className="mt-2 font-serif text-2xl font-bold text-[#221E20]">{subscriptionLabel}</div>
                            </div>
                            <div className="rounded-xl border border-[#221E20]/10 bg-[#faf7ef] p-4">
                                <div className="text-xs uppercase tracking-[0.18em] text-[#221E20]/55">Лимит сегодня</div>
                                <div className="mt-2 font-serif text-2xl font-bold text-[#221E20]">
                                    {quota.dailyFreeRemaining} / {quota.dailyFreeLimit}
                                </div>
                            </div>
                            <div className="rounded-xl border border-[#221E20]/10 bg-[#faf7ef] p-4">
                                <div className="text-xs uppercase tracking-[0.18em] text-[#221E20]/55">История оплат</div>
                                <div className="mt-2 font-serif text-2xl font-bold text-[#221E20]">
                                    {isLoadingPage ? '...' : historyCount}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-[#221E20]/10 p-4">
                                <div className="font-serif text-xl font-bold">1 месяц</div>
                                <div className="mt-1 text-sm text-[#221E20]/65">Безлимит генераций и 3 скачивания в день</div>
                                <div className="mt-3 text-2xl font-serif font-bold">990 ₽</div>
                                <Button
                                    variant="filled"
                                    className="mt-4 w-full"
                                    onClick={() => setActionMessage(`Демо: заявка на тариф "1 месяц" создана (${formatDate(new Date().toISOString())}).`)}
                                >
                                    Оформить тариф
                                </Button>
                            </div>
                            <div className="rounded-xl border border-[#221E20]/10 p-4">
                                <div className="font-serif text-xl font-bold">3 месяца</div>
                                <div className="mt-1 text-sm text-[#221E20]/65">Те же условия, выгоднее по стоимости</div>
                                <div className="mt-3 text-2xl font-serif font-bold">2490 ₽</div>
                                <Button
                                    variant="outlined"
                                    className="mt-4 w-full"
                                    onClick={() => setActionMessage(`Демо: заявка на тариф "3 месяца" создана (${formatDate(new Date().toISOString())}).`)}
                                >
                                    Оформить тариф
                                </Button>
                            </div>
                        </div>

                        {error && <div className="text-sm text-red-600">{error}</div>}
                        {actionMessage && <div className="text-sm text-[#221E20]/75">{actionMessage}</div>}

                        <div className="flex flex-wrap gap-3">
                            <Button variant="outlined" onClick={() => router.push('/profile/tariff-history')}>
                                История оплат тарифа
                            </Button>
                            <Button variant="outlined" onClick={() => router.push('/profile')}>
                                Вернуться в профиль
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </PageLayout>
    );
}
