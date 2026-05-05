'use client';

import PageLayout from '@/components/layout/PageLayout';
import SavedFavoriteCard from '@/components/saved/SavedFavoriteCard';
import { useSavedPage } from '@/hooks/useSavedPage';

export default function SavedPageContent() {
    const {
        user,
        isAuthLoading,
        favorites,
        isLoadingFavorites,
        error,
        openProduct,
    } = useSavedPage();

    if (isAuthLoading || !user || user.role !== 'user') return null;

    return (
        <PageLayout>
            <div className="w-full max-w-[1200px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
                <div className="flex flex-col gap-3 mb-10">
                    <h1 className="font-serif text-4xl font-bold text-[#221E20]">Избранное</h1>
                    <p className="text-[#221E20]/60">Товары, добавленные в закладки.</p>
                </div>

                {isLoadingFavorites && (
                    <div className="text-sm opacity-60">Загружаю избранное...</div>
                )}

                {!isLoadingFavorites && error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
                )}

                {!isLoadingFavorites && !error && favorites.length === 0 && (
                    <div className="bg-white border border-[#221E20]/10 rounded-xl p-6 text-sm text-[#221E20]/60">
                        В избранном пока пусто. Перейдите в магазин и добавьте товары в закладки.
                    </div>
                )}

                {!isLoadingFavorites && !error && favorites.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map((item) => (
                            <SavedFavoriteCard
                                key={item.id}
                                item={item}
                                onOpenProduct={openProduct}
                            />
                        ))}
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
