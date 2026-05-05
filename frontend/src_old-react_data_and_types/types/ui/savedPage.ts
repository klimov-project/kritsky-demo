import type { AuthUser } from '@/lib/authApi';
import type { SavedPageFavoriteProduct } from '@/types/api/savedPage';

export interface SavedFavoriteCardProps {
    item: SavedPageFavoriteProduct;
    onOpenProduct: (productId: string) => void;
}

export interface UseSavedPageResult {
    user: AuthUser | null;
    isAuthLoading: boolean;
    favorites: SavedPageFavoriteProduct[];
    isLoadingFavorites: boolean;
    error: string;
    openProduct: (productId: string) => void;
}
