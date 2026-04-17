import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
    addShopProductToCart,
    addShopProductToFavorites,
    loadShopFavoriteProductIds,
    loadShopProductDetails,
    removeShopProductFromFavorites,
} from '@/lib/api/shopProductDetails';
import type { ShopProductDetailsProduct } from '@/types/api/shopProductDetails';
import type { UseShopProductDetailsPageOptions, UseShopProductDetailsPageResult } from '@/types/ui/shopProductDetails';
import { getShopProductDisplayImage, getShopProductMarketplaceLinks } from '@/utils/shopProductDetails';

export const useShopProductDetailsPage = ({ productId }: UseShopProductDetailsPageOptions): UseShopProductDetailsPageResult => {
    const router = useRouter();
    const { user } = useAuth();

    const [product, setProduct] = useState<ShopProductDetailsProduct>(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [cartMessage, setCartMessage] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setError('');
            setIsLoading(true);

            try {
                const data = await loadShopProductDetails(productId);
                if (cancelled) return;

                if (data.category === 'download_packs') {
                    router.replace('/profile/download-packs');
                    return;
                }

                setProduct(data);
                setActiveImageIndex(0);

                if (user?.role === 'user') {
                    const ids = await loadShopFavoriteProductIds();
                    if (!cancelled) {
                        setIsBookmarked(ids.has(data.id));
                    }
                } else if (!cancelled) {
                    setIsBookmarked(false);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить товар');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [productId, router, user?.role]);

    const displayImage = useMemo(
        () => getShopProductDisplayImage(product, activeImageIndex),
        [activeImageIndex, product],
    );

    const marketplaceLinks = useMemo(
        () => getShopProductMarketplaceLinks(product),
        [product],
    );

    const handleBookmarkToggle = useCallback(async () => {
        if (!product) return;
        setCartMessage('');

        if (!user || user.role !== 'user') {
            router.push('/login');
            return;
        }

        const nextValue = !isBookmarked;
        setIsBookmarked(nextValue);
        try {
            if (nextValue) {
                await addShopProductToFavorites(product.id);
            } else {
                await removeShopProductFromFavorites(product.id);
            }
        } catch (errorValue) {
            setIsBookmarked(!nextValue);
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось обновить закладки');
        }
    }, [isBookmarked, product, router, user]);

    const handleAddToCart = useCallback(async () => {
        if (!product) return;
        setError('');
        setCartMessage('');

        if (!user || user.role !== 'user') {
            router.push('/login');
            return;
        }

        try {
            await addShopProductToCart(product.id);
            setCartMessage('Товар добавлен в корзину.');
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось добавить товар в корзину');
        }
    }, [product, router, user]);

    const selectImage = useCallback((index: number) => {
        setActiveImageIndex(index);
    }, []);

    const goToShop = useCallback(() => {
        router.push('/shop');
    }, [router]);

    const goToCart = useCallback(() => {
        router.push('/cart');
    }, [router]);

    return {
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
    };
};
