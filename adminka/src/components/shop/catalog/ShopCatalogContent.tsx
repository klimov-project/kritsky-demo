'use client';

import PageLayout from '@/components/layout/PageLayout';
import ShopBookCard from '@/components/shop/ShopBookCard';
import ShopCatalogFilters from '@/components/shop/catalog/ShopCatalogFilters';
import { useShopPage } from '@/hooks/useShopPage';
import { CATEGORY_LABELS } from '@/mocks/shop';
import { SHOP_CATALOG_FULFILLMENT_FILTERS } from '@/utils/shopCatalog';
import styles from './ShopCatalogContent.module.scss';

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
        <PageLayout bodyClassName="index-page">
            <div className={styles.page}>
                <h1 className={styles.title}>Магазин</h1>

                <div className={styles.content}>
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

                    <div className={styles.products}>
                        {isLoading && <p className={styles.statusText}>Загружаю товары...</p>}

                        {!isLoading && error && (
                            <p className={styles.errorText}>{error}</p>
                        )}

                        {!isLoading && !error && bookmarkError && (
                            <p className={styles.errorText}>{bookmarkError}</p>
                        )}

                        {!isLoading && !error && cartMessage && (
                            <p className={styles.successText}>{cartMessage}</p>
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
                            <p className={`${styles.statusText} ${styles.emptyText}`}>
                                По заданным фильтрам товары не найдены
                            </p>
                        )}

                        {!isLoading && !error && visibleCount < filteredProducts.length && (
                            <div className={styles.loadMoreWrap}>
                                <button type="button" className={styles.loadMoreButton} onClick={handleLoadMore}>
                                    Показать ещё
                                </button>
                            </div>
                        )}

                        {!isLoading && !error && filteredProducts.length > 0 && visibleCount >= filteredProducts.length && (
                            <p className={styles.statusText}>
                                Вы просмотрели все товары
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
