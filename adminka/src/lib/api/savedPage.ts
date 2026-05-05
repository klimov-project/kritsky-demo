import { listFavoriteProducts } from '@/lib/shopApi';
import type { SavedPageFavoriteProduct } from '@/types/api/savedPage';

export const loadSavedFavoriteProducts = async (): Promise<SavedPageFavoriteProduct[]> => {
    return listFavoriteProducts();
};
