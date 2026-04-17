'use client';

import PageLayout from '@/components/layout/PageLayout';
import MyBookDetailsContent from '@/components/my-books/details/MyBookDetailsContent';
import MyBookDetailsNotFound from '@/components/my-books/details/MyBookDetailsNotFound';
import { useMyBookDetailsPage } from '@/hooks/useMyBookDetailsPage';

export default function PurchasedProductPage() {
    const {
        user,
        isAuthLoading,
        purchase,
        isPageLoading,
        error,
        revealedAnswers,
        toggleAnswers,
        handlePrint,
        handleDownloadPdf,
        goToMyBooks,
        goToShopProduct,
    } = useMyBookDetailsPage();

    if (isAuthLoading || !user || user.role !== 'user') {
        return null;
    }

    if (isPageLoading) {
        return (
            <PageLayout>
                <div className="w-full max-w-[980px] mx-auto px-4 md:px-0 pt-[90px] pb-20 text-sm opacity-70">
                    Загружаю товар...
                </div>
            </PageLayout>
        );
    }

    if (error || !purchase) {
        return (
            <PageLayout>
                <MyBookDetailsNotFound
                    error={error}
                    onGoToMyBooks={goToMyBooks}
                />
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <MyBookDetailsContent
                purchase={purchase}
                revealedAnswers={revealedAnswers}
                onToggleAnswers={toggleAnswers}
                onPrint={handlePrint}
                onDownloadPdf={handleDownloadPdf}
                onGoToShopProduct={goToShopProduct}
            />
        </PageLayout>
    );
}
