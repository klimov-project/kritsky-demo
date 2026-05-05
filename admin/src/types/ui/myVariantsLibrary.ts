import type { AuthUser } from '@/lib/authApi';
import type {
    SavedVariantFolder,
    SavedVariantFoldersResponse,
    SavedVariantsCatalogResponse,
    VariantListMode,
    VariantSortBy,
} from '@/lib/variantsApi';
import type { SavedVariantRecord } from '@/types/testVariant';

export interface MyVariantsLibraryState {
    user: AuthUser | null;
    isAuthLoading: boolean;
    isLoaded: boolean;
    isSubmitting: boolean;
    error: string;
    mode: VariantListMode;
    activeView: 'all' | 'folders' | 'folder' | 'unsorted';
    folderId: number | null;
    folders: SavedVariantFolder[];
    foldersMeta: SavedVariantFoldersResponse;
    variants: SavedVariantRecord[];
    variantsMeta: SavedVariantsCatalogResponse;
    folderViewTitle: string;
    search: string;
    sortBy: VariantSortBy;
    sortOrder: 'asc' | 'desc';
    page: number;
    limit: number;
}

export interface UseMyVariantsLibraryResult extends MyVariantsLibraryState {
    setMode: (mode: 'all' | 'folders' | 'unsorted') => void;
    setFolderMode: (folderId: number | null) => void;
    setSearch: (value: string) => void;
    setSortBy: (value: VariantSortBy) => void;
    toggleSortOrder: () => void;
    setPage: (value: number) => void;
    setLimit: (value: number) => void;
    refreshCurrentView: () => Promise<void>;
    createFolder: (name: string) => Promise<boolean>;
    renameFolder: (folderId: number, nextName: string) => Promise<boolean>;
    deleteFolder: (folderId: number) => Promise<boolean>;
    reorderFolder: (folderId: number, direction: 'up' | 'down') => Promise<void>;
    moveVariant: (variantId: string | number, nextFolderId: number | null) => Promise<void>;
    reorderVariant: (variantId: string | number, direction: 'up' | 'down') => Promise<void>;
    deleteVariant: (variantId: string | number) => Promise<boolean>;
}
