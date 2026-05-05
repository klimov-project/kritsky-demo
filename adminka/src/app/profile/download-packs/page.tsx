'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import PageLayout from '@/components/layout/PageLayout';
import Button from '@/components/shared/Button';
import { useAuth } from '@/context/AuthContext';
import { addProductToCart, listShopProducts, type ShopProductExtended } from '@/lib/shopApi';
import { getVariantExportQuota, type VariantExportQuota } from '@/lib/variantsApi';

const EMPTY_QUOTA: VariantExportQuota = {
    hasActiveSubscription: false,
    dailyFreeLimit: 0,
    dailyFreeUsed: 0,
    dailyFreeRemaining: 0,
    paidDownloadsRemaining: 0,
};

export default function DownloadPacksPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    const [packs, setPacks] = useState<ShopProductExtended[]>([]);
    const [quota, setQuota] = useState<VariantExportQuota>(EMPTY_QUOTA);
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

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
                const [response, nextQuota] = await Promise.all([
                    listShopProducts({ category: 'download_packs', limit: 100, offset: 0 }),
                    getVariantExportQuota(),
                ]);
                if (cancelled) return;
                setPacks(response.items);
                setQuota(nextQuota);
            } catch (errorValue) {
                if (!cancelled) {
                    setPacks([]);
                    setQuota(EMPTY_QUOTA);
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить пакеты скачиваний');
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

    const handleAddPackToCart = async (productId: string) => {
        setStatusMessage('');
        setError('');
        try {
            await addProductToCart(productId, 1);
            setStatusMessage('Пакет добавлен в корзину.');
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось добавить пакет в корзину');
        }
    };

    if (isLoading || !user || user.role !== 'user') return null;

    return (
        <PageLayout>
            <div className="w-full max-w-[1200px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
                <div className="max-w-[860px] space-y-6">
                    <div>
                        <h1 className="font-serif text-4xl font-bold text-[#221E20]">Пакеты скачиваний</h1>
                        <p className="mt-2 text-[#221E20]/60">
                            Отдельная страница докупки скачиваний и распечатываний (без перехода в общий магазин).
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
                                <div className="text-xs uppercase tracking-[0.18em] text-[#221E20]/55">Купленные в запасе</div>
                                <div className="mt-2 font-serif text-2xl font-bold text-[#221E20]">
                                    {quota.paidDownloadsRemaining}
                                </div>
                            </div>
                        </div>

                        {isLoadingPage && <div className="text-sm text-[#221E20]/60">Загружаю пакеты...</div>}
                        {!isLoadingPage && error && <div className="text-sm text-red-600">{error}</div>}
                        {!isLoadingPage && statusMessage && <div className="text-sm text-[#221E20]/75">{statusMessage}</div>}

                        {!isLoadingPage && !error && packs.length === 0 && (
                            <div className="rounded-xl border border-[#221E20]/10 p-4 text-sm text-[#221E20]/65">
                                Пока не добавлено ни одного пакета скачиваний.
                            </div>
                        )}

                        {!isLoadingPage && !error && packs.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {packs.map((pack) => (
                                    <div key={pack.id} className="rounded-xl border border-[#221E20]/10 p-4">
                                        <div className="font-serif text-xl font-bold">{pack.title}</div>
                                        <div className="mt-2 text-sm text-[#221E20]/70">{pack.description}</div>
                                        <div className="mt-3 text-sm text-[#221E20]/65">
                                            Скачиваний в пакете: {pack.downloadPackConfig?.downloadsCount ?? '—'}
                                        </div>
                                        <div className="mt-3 text-2xl font-serif font-bold">{pack.price} ₽</div>
                                        <Button
                                            variant="filled"
                                            className="mt-4 w-full"
                                            onClick={() => handleAddPackToCart(pack.id)}
                                        >
                                            Добавить в корзину
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            <Button variant="outlined" onClick={() => router.push('/cart')}>
                                Перейти в корзину
                            </Button>
                            <Button variant="outlined" onClick={() => router.push('/profile/download-history')}>
                                История скачиваний и распечатываний
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
