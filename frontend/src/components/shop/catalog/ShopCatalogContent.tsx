'use client';

import PageLayout from '@/components/layout/PageLayout';
import Button from '@/components/shared/Button';
import ShopBookCard from '@/components/shop/ShopBookCard';
import ShopCatalogFilters from '@/components/shop/catalog/ShopCatalogFilters';
import { useShopPage } from '@/hooks/useShopPage';
import { CATEGORY_LABELS } from '@/mocks/shop';
import { SHOP_CATALOG_FULFILLMENT_FILTERS } from '@/utils/shopCatalog';

export default function ShopCatalogContent() {
    const {
        visibleProducts,
        filteredProducts,
        favoriteIds,
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
        visibleCount,
        setSearchValue,
        setSelectedCategory,
        setSelectedAuthor,
        setSelectedFulfillment,
        toggleFilters,
        handleToggleBookmark,
        handleAddToCart,
        handleLoadMore,
        clearFilters,
    } = useShopPage();

    return (
        <PageLayout hideHeader={false} hideFooter={false}>
            <div className="w-full flex flex-col items-center min-h-screen">
                <div className="w-full max-w-[750px] px-4 md:px-0 flex flex-col">
                    <ShopCatalogFilters
                        searchValue={searchValue}
                        isFiltersOpen={isFiltersOpen}
                        selectedCategory={selectedCategory}
                        selectedAuthor={selectedAuthor}
                        selectedFulfillment={selectedFulfillment}
                        authors={authors}
                        visibleCategories={visibleCategories}
                        fulfillmentFilters={SHOP_CATALOG_FULFILLMENT_FILTERS}
                        onSearchChange={setSearchValue}
                        onToggleFilters={toggleFilters}
                        onCategoryChange={setSelectedCategory}
                        onAuthorChange={setSelectedAuthor}
                        onFulfillmentChange={setSelectedFulfillment}
                        onClearFilters={clearFilters}
                    />

                    <div className="mt-[85px] flex flex-col gap-[60px] pb-20">
                        {isLoading && <div className="text-sm opacity-60">Загружаю товары...</div>}

                        {!isLoading && error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
                        )}

                        {!isLoading && !error && bookmarkError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{bookmarkError}</div>
                        )}

                        {!isLoading && !error && cartMessage && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">{cartMessage}</div>
                        )}

                        {!isLoading && !error && visibleProducts.map((product) => (
                            <ShopBookCard
                                key={product.id}
                                id={product.id}
                                title={product.title}
                                description={product.description}
                                price={product.price}
                                imageUrl={product.coverUrl || product.gallery[0]}
                                categoryLabel={CATEGORY_LABELS[product.category] || product.category}
                                fulfillment={product.fulfillment}
                                isBookmarked={favoriteIds.has(product.id)}
                                onToggleBookmark={handleToggleBookmark}
                                onAddToCart={handleAddToCart}
                            />
                        ))}

                        {!isLoading && !error && filteredProducts.length === 0 && (
                            <div className="text-center opacity-40 font-serif text-sm py-8">
                                По заданным фильтрам товары не найдены
                            </div>
                        )}

                        {!isLoading && !error && visibleCount < filteredProducts.length && (
                            <div className="flex justify-center mt-4">
                                <Button
                                    variant="outlined"
                                    onClick={handleLoadMore}
                                    className="!border-[#221E20]/20 hover:!border-[#221E20] min-w-[200px]"
                                >
                                    Показать ещё
                                </Button>
                            </div>
                        )}

                        {!isLoading && !error && filteredProducts.length > 0 && visibleCount >= filteredProducts.length && (
                            <div className="text-center opacity-40 font-serif text-sm py-8">
                                Вы просмотрели все товары
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
