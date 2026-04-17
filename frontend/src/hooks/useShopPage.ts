import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
    addShopCatalogProductToCart,
    addShopCatalogProductToFavorites,
    loadShopCatalogFavoriteIds,
    loadShopCatalogProducts,
    removeShopCatalogProductFromFavorites,
} from '@/lib/api/shopCatalog';
import type {
    ShopCatalogFavoriteIds,
    ShopCatalogProduct,
    ShopCatalogSelectedCategory,
    ShopCatalogSelectedFulfillment,
} from '@/types/api/shopCatalog';
import type { UseShopPageResult } from '@/types/ui/shopCatalog';
import {
    filterShopCatalogProducts,
    getShopCatalogAuthors,
    getShopCatalogVisibleCategories,
    getShopCatalogVisibleProducts,
    resolveShopCatalogCategoryQuery,
    resolveShopCatalogFulfillmentQuery,
} from '@/utils/shopCatalog';

export const useShopPage = (): UseShopPageResult => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const [products, setProducts] = useState<ShopCatalogProduct[]>([]);
    const [favoriteIds, setFavoriteIds] = useState<ShopCatalogFavoriteIds>(new Set());
    const [visibleCount, setVisibleCount] = useState(5);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState<ShopCatalogSelectedCategory>('');
    const [selectedAuthor, setSelectedAuthor] = useState('');
    const [selectedFulfillment, setSelectedFulfillment] = useState<ShopCatalogSelectedFulfillment>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [bookmarkError, setBookmarkError] = useState('');
    const [cartMessage, setCartMessage] = useState('');

    useEffect(() => {
        const queryCategory = searchParams.get('category');
        const queryFulfillment = searchParams.get('fulfillment');
        const querySearch = searchParams.get('search');

        const resolvedCategory = resolveShopCatalogCategoryQuery(queryCategory);
        const resolvedFulfillment = resolveShopCatalogFulfillmentQuery(queryFulfillment);

        if (resolvedCategory) {
            setSelectedCategory(resolvedCategory);
            setIsFiltersOpen(true);
        } else {
            setSelectedCategory('');
        }

        if (resolvedFulfillment) {
            setSelectedFulfillment(resolvedFulfillment);
            setIsFiltersOpen(true);
        } else {
            setSelectedFulfillment('');
        }

        setSearchValue(querySearch || '');
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setError('');
            setIsLoading(true);
            try {
                const items = await loadShopCatalogProducts();
                if (!cancelled) {
                    setProducts(getShopCatalogVisibleProducts(items));
                }

                if (user?.role === 'user') {
                    const ids = await loadShopCatalogFavoriteIds();
                    if (!cancelled) {
                        setFavoriteIds(ids);
                    }
                } else if (!cancelled) {
                    setFavoriteIds(new Set());
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить товары');
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
    }, [user?.role]);

    const authors = useMemo(
        () => getShopCatalogAuthors(products),
        [products],
    );

    const visibleCategories = useMemo(
        () => getShopCatalogVisibleCategories(),
        [],
    );

    const filteredProducts = useMemo(() => {
        return filterShopCatalogProducts(
            products,
            searchValue,
            selectedCategory,
            selectedAuthor,
            selectedFulfillment,
        );
    }, [products, searchValue, selectedCategory, selectedAuthor, selectedFulfillment]);

    const visibleProducts = filteredProducts.slice(0, visibleCount);

    const toggleFilters = () => {
        setIsFiltersOpen((previous) => !previous);
    };

    const handleToggleBookmark = async (id: string, nextValue: boolean) => {
        setBookmarkError('');
        setCartMessage('');

        if (!user || user.role !== 'user') {
            router.push('/login');
            return;
        }

        const previous = new Set(favoriteIds);
        const optimistic = new Set(favoriteIds);

        if (nextValue) {
            optimistic.add(id);
        } else {
            optimistic.delete(id);
        }
        setFavoriteIds(optimistic);

        try {
            if (nextValue) {
                await addShopCatalogProductToFavorites(id);
            } else {
                await removeShopCatalogProductFromFavorites(id);
            }
        } catch (errorValue) {
            setFavoriteIds(previous);
            setBookmarkError(errorValue instanceof Error ? errorValue.message : 'Не удалось обновить закладки');
        }
    };

    const handleAddToCart = async (id: string) => {
        setBookmarkError('');
        setCartMessage('');

        if (!user || user.role !== 'user') {
            router.push('/login');
            return;
        }

        try {
            await addShopCatalogProductToCart(id);
            setCartMessage('Товар добавлен в корзину.');
        } catch (errorValue) {
            setBookmarkError(errorValue instanceof Error ? errorValue.message : 'Не удалось добавить товар в корзину');
        }
    };

    const handleLoadMore = () => {
        setVisibleCount((previous) => previous + 5);
    };

    const clearFilters = () => {
        setSearchValue('');
        setSelectedCategory('');
        setSelectedAuthor('');
        setSelectedFulfillment('');
        setVisibleCount(5);
    };

    return {
        products,
        visibleProducts,
        filteredProducts,
        favoriteIds,
        visibleCount,
        isFiltersOpen,
        searchValue,
        selectedCategory,
        selectedAuthor,
        selectedFulfillment,
        isLoading,
        error,
        bookmarkError,
        cartMessage,
        authors,
        visibleCategories,
        setSearchValue,
        setSelectedCategory,
        setSelectedAuthor,
        setSelectedFulfillment,
        toggleFilters,
        handleToggleBookmark,
        handleAddToCart,
        handleLoadMore,
        clearFilters,
    };
};
