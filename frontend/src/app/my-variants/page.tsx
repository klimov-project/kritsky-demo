'use client';

import PageLayout from '@/components/layout/PageLayout';
import ScrollToTopButton from '@/components/layout/ScrollToTopButton';
import MySavedVariantPreview from '@/components/my-variants/list/MySavedVariantPreview';
import MyVariantsStyles from '@/components/my-variants/list/MyVariantsStyles';
import Button from '@/components/shared/Button';
import { useMyVariantsPage } from '@/hooks/useMyVariantsPage';

export default function MyVariantsPage() {
    const {
        user,
        isAuthLoading,
        isLoaded,
        error,
        variants,
        goToGenerator,
        handleDeleteVariant,
    } = useMyVariantsPage();

    if (isAuthLoading || !user || user.role !== 'user') {
        return null;
    }

    return (
        <PageLayout>
            <MyVariantsStyles />

            <div className="w-full max-w-[980px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
                <div className="flex flex-col gap-3 mb-10">
                    <h1 className="font-serif text-4xl font-bold text-[#221E20]">Мои варианты</h1>
                    <p className="text-[#221E20]/60">
                        {variants.length > 0
                            ? `Сохранено вариантов: ${variants.length}`
                            : 'Сохранённые варианты из генератора.'}
                    </p>
                </div>

                {!isLoaded && (
                    <div className="border border-[#221E20]/10 rounded-xl bg-white p-6 text-sm opacity-70">
                        Загружаю сохранённые варианты...
                    </div>
                )}

                {isLoaded && error && (
                    <div className="border border-red-200 rounded-xl bg-red-50 p-6 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {isLoaded && !error && !variants.length && (
                    <div className="border border-[#221E20]/10 rounded-xl bg-white p-8 flex flex-col gap-4 items-start">
                        <div className="text-sm opacity-70">
                            Сохранённых вариантов пока нет. Сначала сохраните вариант в генераторе.
                        </div>
                        <Button variant="outlined" onClick={goToGenerator}>
                            Перейти в генератор
                        </Button>
                    </div>
                )}

                {isLoaded && !error && Boolean(variants.length) && (
                    <div className="space-y-8">
                        {variants.map((saved) => (
                            <MySavedVariantPreview
                                key={saved.id}
                                saved={saved}
                                onDelete={handleDeleteVariant}
                            />
                        ))}
                    </div>
                )}
            </div>
            <ScrollToTopButton />
        </PageLayout>
    );
}
