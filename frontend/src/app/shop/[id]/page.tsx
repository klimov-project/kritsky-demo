'use client';

import React from 'react';

import PageLayout from '@/components/layout/PageLayout';
import ShopProductDetailsContent from '@/components/shop/details/ShopProductDetailsContent';
import ShopProductDetailsError from '@/components/shop/details/ShopProductDetailsError';
import { useShopProductDetailsPage } from '@/hooks/useShopProductDetailsPage';
import type { ShopProductDetailsPageProps } from '@/types/ui/shopProductDetails';

export default function ProductDetailsPage({ params }: ShopProductDetailsPageProps) {
    const resolvedParams = React.use(params);
    const {
        product,
        isBookmarked,
        activeImageIndex,
        isLoading,
        error,
        cartMessage,
        displayImage,
        marketplaceLinks,
        handleBookmarkToggle,
        handleAddToCart,
        selectImage,
        goToShop,
        goToCart,
        openFeedbackModal,
    } = useShopProductDetailsPage({ productId: resolvedParams.id });

    if (isLoading) {
        return (
            <PageLayout hideHeader={false} hideFooter={false} bodyClassName="index-page">
                <div className="w-full max-w-[955px] mx-auto px-4 md:px-0 pt-[90px] pb-20 text-sm opacity-60">
                    Загружаю товар...
                </div>
            </PageLayout>
        );
    }

    if (error || !product) {
        return (
            <PageLayout hideHeader={false} hideFooter={false} bodyClassName="index-page">
                <ShopProductDetailsError
                    message={error}
                    onBackToShop={goToShop}
                />
            </PageLayout>
        );
    }

    return (
        <PageLayout hideHeader={false} hideFooter={false} bodyClassName="index-page">
            <ShopProductDetailsContent
                product={product}
                isBookmarked={isBookmarked}
                activeImageIndex={activeImageIndex}
                displayImage={displayImage}
                marketplaceLinks={marketplaceLinks}
                cartMessage={cartMessage}
                onToggleBookmark={handleBookmarkToggle}
                onAddToCart={handleAddToCart}
                onSelectImage={selectImage}
                onGoToCart={goToCart}
                onOpenFeedback={openFeedbackModal}
            />
        </PageLayout>
    );
}
