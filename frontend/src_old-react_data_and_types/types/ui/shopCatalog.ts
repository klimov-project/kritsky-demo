import type { ProductCategory } from '@/types/shop';
import type {
    ShopCatalogProduct,
    ShopCatalogSelectedCategory,
    ShopCatalogSelectedFulfillment,
} from '@/types/api/shopCatalog';

export interface ShopCatalogFulfillmentFilter {
    key: 'DIGITAL' | 'PHYSICAL';
    label: string;
}

export interface ShopCatalogFiltersProps {
    searchValue: string;
    isFiltersOpen: boolean;
    selectedCategory: ShopCatalogSelectedCategory;
    selectedAuthor: string;
    selectedFulfillment: ShopCatalogSelectedFulfillment;
    authors: string[];
    visibleCategories: ProductCategory[];
    fulfillmentFilters: ShopCatalogFulfillmentFilter[];
    onSearchChange: (value: string) => void;
    onToggleFilters: () => void;
    onCategoryChange: (value: ShopCatalogSelectedCategory) => void;
    onAuthorChange: (value: string) => void;
    onFulfillmentChange: (value: ShopCatalogSelectedFulfillment) => void;
    onClearFilters: () => void;
}

export interface UseShopPageResult {
    products: ShopCatalogProduct[];
    visibleProducts: ShopCatalogProduct[];
    filteredProducts: ShopCatalogProduct[];
    favoriteIds: Set<string>;
    visibleCount: number;
    isFiltersOpen: boolean;
    searchValue: string;
    selectedCategory: ShopCatalogSelectedCategory;
    selectedAuthor: string;
    selectedFulfillment: ShopCatalogSelectedFulfillment;
    isLoading: boolean;
    error: string;
    bookmarkError: string;
    cartMessage: string;
    authors: string[];
    visibleCategories: ProductCategory[];
    setSearchValue: (value: string) => void;
    setSelectedCategory: (value: ShopCatalogSelectedCategory) => void;
    setSelectedAuthor: (value: string) => void;
    setSelectedFulfillment: (value: ShopCatalogSelectedFulfillment) => void;
    toggleFilters: () => void;
    handleToggleBookmark: (id: string, nextValue: boolean) => Promise<void>;
    handleAddToCart: (id: string) => Promise<void>;
    handleLoadMore: () => void;
    clearFilters: () => void;
}
