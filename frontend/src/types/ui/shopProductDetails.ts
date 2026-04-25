import type { ShopProductDetailsMarketplaceLink, ShopProductDetailsProduct } from '@/types/api/shopProductDetails';
import type { ShopProductExtended } from '@/lib/shopApi';

export interface UseShopProductDetailsPageResult {
    product: ShopProductDetailsProduct;
    isBookmarked: boolean;
    activeImageIndex: number;
    isLoading: boolean;
    error: string;
    cartMessage: string;
    displayImage: string;
    marketplaceLinks: ShopProductDetailsMarketplaceLink[];
    handleBookmarkToggle: () => Promise<void>;
    handleAddToCart: () => Promise<void>;
    selectImage: (index: number) => void;
    goToShop: () => void;
    goToCart: () => void;
    openFeedbackModal: () => void;
}

export interface ShopProductDetailsPageProps {
    params: Promise<{ id: string }>;
}

export interface UseShopProductDetailsPageOptions {
    productId: string;
}

export interface ShopProductDetailsContentProps {
    product: ShopProductExtended;
    isBookmarked: boolean;
    activeImageIndex: number;
    displayImage: string;
    marketplaceLinks: ShopProductDetailsMarketplaceLink[];
    cartMessage: string;
    onToggleBookmark: () => Promise<void>;
    onAddToCart: () => Promise<void>;
    onSelectImage: (index: number) => void;
    onGoToCart: () => void;
    onOpenFeedback: () => void;
}

export interface ShopProductDetailsErrorProps {
    message: string;
    onBackToShop: () => void;
}
