'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import PageLayout from '@/components/layout/PageLayout';
import Button from '@/components/shared/Button';
import { useAuth } from '@/context/AuthContext';
import { listPaymentHistory } from '@/lib/shopApi';
import type { PaymentHistoryItem } from '@/types/shop';

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

export default function TariffHistoryPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [error, setError] = useState('');

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
                const items = await listPaymentHistory();
                if (!cancelled) {
                    setHistory(items);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setHistory([]);
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить историю оплат тарифа');
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

    const subscriptionPayments = useMemo(
        () => history.filter((item) => item.kind === 'subscription'),
        [history],
    );

    if (isLoading || !user || user.role !== 'user') return null;

    return (
        <PageLayout>
            <div className="w-full max-w-[1200px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
                <div className="max-w-[860px] space-y-6">
                    <div>
                        <h1 className="font-serif text-4xl font-bold text-[#221E20]">История оплат тарифа</h1>
                        <p className="mt-2 text-[#221E20]/60">
                            Отдельная страница истории по оплатам подписки.
                        </p>
                    </div>

                    <section className="rounded-xl border border-[#221E20]/10 bg-white p-6 space-y-4">
                        {isLoadingPage && <div className="text-sm text-[#221E20]/60">Загружаю историю...</div>}
                        {!isLoadingPage && error && <div className="text-sm text-red-600">{error}</div>}

                        {!isLoadingPage && !error && subscriptionPayments.length === 0 && (
                            <div className="rounded-xl border border-[#221E20]/10 p-4 text-sm text-[#221E20]/65">
                                Оплат тарифа пока нет.
                            </div>
                        )}

                        {!isLoadingPage && !error && subscriptionPayments.length > 0 && (
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
                                        {subscriptionPayments.map((payment) => (
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
                            <Button variant="outlined" onClick={() => router.push('/profile/tariff')}>
                                К странице тарифа
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
