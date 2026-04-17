'use client';

import PageLayout from '@/components/layout/PageLayout';
import Button from '@/components/shared/Button';
import MyBookPurchaseCard from '@/components/my-books/list/MyBookPurchaseCard';
import { useMyBooksPage } from '@/hooks/useMyBooksPage';

export default function MyBooksPageContent() {
    const {
        user,
        isAuthLoading,
        filteredPurchases,
        isLoadingPurchases,
        error,
        currentCategoryLabel,
        clearCategoryFilter,
        openPurchase,
    } = useMyBooksPage();

    if (isAuthLoading || !user || user.role !== 'user') {
        return null;
    }

    return (
        <PageLayout>
            <div className="w-full max-w-[1200px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
                <div className="flex flex-col gap-3 mb-10">
                    <h1 className="font-serif text-4xl font-bold text-[#221E20]">Мои покупки</h1>
                    <p className="text-[#221E20]/60">
                        {currentCategoryLabel ? `Покупки в разделе «${currentCategoryLabel}».` : 'История покупок и оплаченных цифровых продуктов.'}
                    </p>
                    {currentCategoryLabel && (
                        <div className="flex">
                            <Button variant="outlined" className="text-xs py-2" onClick={clearCategoryFilter}>
                                Показать все покупки
                            </Button>
                        </div>
                    )}
                </div>

                {isLoadingPurchases && <div className="text-sm opacity-60">Загружаю покупки...</div>}

                {!isLoadingPurchases && error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!isLoadingPurchases && !error && filteredPurchases.length === 0 && (
                    <div className="bg-white border border-[#221E20]/10 rounded-xl p-6 text-sm text-[#221E20]/60">
                        {currentCategoryLabel ? 'Покупок в этом разделе пока нет.' : 'У вас пока нет покупок.'}
                    </div>
                )}

                {!isLoadingPurchases && !error && filteredPurchases.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPurchases.map((purchase) => (
                            <MyBookPurchaseCard
                                key={purchase.id}
                                purchase={purchase}
                                onOpenPurchase={openPurchase}
                            />
                        ))}
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
