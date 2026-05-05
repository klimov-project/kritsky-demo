'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import PageLayout from '@/components/layout/PageLayout';
import Button from '@/components/shared/Button';
import { useAuth } from '@/context/AuthContext';
import { listPaymentHistory } from '@/lib/shopApi';
import { getVariantExportQuota, type VariantExportQuota } from '@/lib/variantsApi';
import type { PaymentHistoryItem } from '@/types/shop';

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

export default function DownloadHistoryPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
    const [quota, setQuota] = useState<VariantExportQuota>(EMPTY_QUOTA);
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isLoading) return;
        if (!user || user.role !== 'user') {
            router.replace('/?modal=login');
        }
    }, [isLoading, router, user]);

    useEffect(() => {
        if (isLoading || !user || user.role !== 'user') return;

        let cancelled = false;
        const load = async () => {
            setIsLoadingPage(true);
            setError('');
            try {
                const [payments, nextQuota] = await Promise.all([
                    listPaymentHistory(),
                    getVariantExportQuota(),
                ]);
                if (cancelled) return;
                setHistory(payments);
                setQuota(nextQuota);
            } catch (errorValue) {
                if (!cancelled) {
                    setHistory([]);
                    setQuota(EMPTY_QUOTA);
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить историю скачиваний');
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

    const downloadPayments = useMemo(
        () => history.filter((item) => item.kind === 'download_pack'),
        [history],
    );

    if (isLoading || !user || user.role !== 'user') return null;

    return (
        <PageLayout>
            <div className="w-full max-w-[1200px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
                <div className="max-w-[860px] space-y-6">
                    <div>
                        <h1 className="font-serif text-4xl font-bold text-[#221E20]">История скачиваний и распечатываний</h1>
                        <p className="mt-2 text-[#221E20]/60">
                            Отдельная страница по платежам за пакеты и текущему остатку скачиваний.
                        </p>
                    </div>

                    <section className="rounded-xl border border-[#221E20]/10 bg-white p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-[#221E20]/10 bg-[#faf7ef] p-4">
                                <div className="text-xs uppercase tracking-[0.18em] text-[#221E20]/55">Бесплатные на сегодня</div>
                                <div className="mt-2 font-serif text-2xl font-bold text-[#221E20]">
                                    {quota.dailyFreeRemaining} / {quota.dailyFreeLimit}
                                </div>
                            </div>
                            <div className="rounded-xl border border-[#221E20]/10 bg-[#faf7ef] p-4">
                                <div className="text-xs uppercase tracking-[0.18em] text-[#221E20]/55">Платный остаток</div>
                                <div className="mt-2 font-serif text-2xl font-bold text-[#221E20]">
                                    {quota.paidDownloadsRemaining}
                                </div>
                            </div>
                        </div>

                        {isLoadingPage && <div className="text-sm text-[#221E20]/60">Загружаю историю...</div>}
                        {!isLoadingPage && error && <div className="text-sm text-red-600">{error}</div>}

                        {!isLoadingPage && !error && downloadPayments.length === 0 && (
                            <div className="rounded-xl border border-[#221E20]/10 p-4 text-sm text-[#221E20]/65">
                                Покупок пакетов скачиваний пока нет.
                            </div>
                        )}

                        {!isLoadingPage && !error && downloadPayments.length > 0 && (
                            <div className="overflow-x-auto rounded-xl border border-[#221E20]/10">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-[#faf7ef]">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold">Дата</th>
                                            <th className="px-4 py-3 text-left font-semibold">Сумма</th>
                                            <th className="px-4 py-3 text-left font-semibold">Статус</th>
                                            <th className="px-4 py-3 text-left font-semibold">Метод</th>
                                            <th className="px-4 py-3 text-left font-semibold">ID платежа</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {downloadPayments.map((payment) => (
                                            <tr key={payment.id} className="border-t border-[#221E20]/10">
                                                <td className="px-4 py-3">{formatDate(payment.createdAt)}</td>
                                                <td className="px-4 py-3 font-semibold">{payment.amount} ₽</td>
                                                <td className="px-4 py-3">{payment.status || '—'}</td>
                                                <td className="px-4 py-3">{payment.method || '—'}</td>
                                                <td className="px-4 py-3">{payment.paymentId || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            <Button variant="outlined" onClick={() => router.push('/profile/download-packs')}>
                                К докупке скачиваний
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
