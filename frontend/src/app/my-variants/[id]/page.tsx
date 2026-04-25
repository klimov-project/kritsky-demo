'use client';

import PageLayout from '@/components/layout/PageLayout';
import ScrollToTopButton from '@/components/layout/ScrollToTopButton';
import MyVariantDetailsContent from '@/components/my-variants/details/MyVariantDetailsContent';
import MyVariantDetailsNotFound from '@/components/my-variants/details/MyVariantDetailsNotFound';
import MyVariantDetailsStyles from '@/components/my-variants/details/MyVariantDetailsStyles';
import { useMyVariantDetailsPage } from '@/hooks/useMyVariantDetailsPage';

export default function VariantDetailsPage() {
    const {
        user,
        isAuthLoading,
        savedVariant,
        isLoaded,
        error,
        exportQuota,
        handleDownload,
        handlePrint,
        goToVariants,
        goToGenerator,
    } = useMyVariantDetailsPage();

    if (isAuthLoading || (!isLoaded && user?.role === 'user')) {
        return (
            <PageLayout>
                <div className="w-full max-w-[900px] mx-auto px-4 md:px-0 pt-[90px] pb-20 text-sm opacity-70">
                    Загружаю сохранённый вариант...
                </div>
            </PageLayout>
        );
    }

    if (!user || user.role !== 'user') {
        return null;
    }

    if (!savedVariant) {
        return (
            <PageLayout>
                <MyVariantDetailsNotFound
                    error={error}
                    onGoToVariants={goToVariants}
                    onGoToGenerator={goToGenerator}
                />
            </PageLayout>
        );
    }

    return (
        <PageLayout bodyClassName="test-variant-page">
            <MyVariantDetailsStyles />
            <MyVariantDetailsContent
                savedVariant={savedVariant}
                exportQuota={exportQuota}
                onPrint={handlePrint}
                onDownload={handleDownload}
            />
            <ScrollToTopButton />
        </PageLayout>
    );
}
