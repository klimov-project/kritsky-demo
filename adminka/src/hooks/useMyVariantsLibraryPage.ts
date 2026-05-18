import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
    createVariantFolder,
    loadSavedVariantFolders,
    loadSavedVariantsCatalog,
    moveVariantToFolder,
    removeSavedVariant,
    removeVariantFolder,
    renameVariantFolder,
    reorderVariantFolders,
    reorderVariantsInContainer,
} from '@/lib/api/myVariantsLibrary';
import type { SavedVariantFoldersResponse, SavedVariantsCatalogResponse, VariantListMode, VariantSortBy } from '@/lib/variantsApi';
import type { UseMyVariantsLibraryResult } from '@/types/ui/myVariantsLibrary';

const DEFAULT_LIMIT = 20;
const DEFAULT_CATALOG: SavedVariantsCatalogResponse = {
    items: [],
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 0,
    mode: 'all',
    folderId: null,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
};

const DEFAULT_FOLDERS: SavedVariantFoldersResponse = {
    items: [],
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
    search: '',
    sortBy: 'order',
    sortOrder: 'asc',
};

const parseMode = (value: string | null): VariantListMode => {
    if (value === 'folder') return 'folder';
    if (value === 'unsorted') return 'unsorted';
    return 'all';
};

const parseFolderId = (value: string | null): number | null => {
    if (!value) return null;
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    return parsed;
};

export const useMyVariantsLibraryPage = (): UseMyVariantsLibraryResult => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [isLoaded, setIsLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [folders, setFolders] = useState<UseMyVariantsLibraryResult['folders']>([]);
    const [foldersMeta, setFoldersMeta] = useState<SavedVariantFoldersResponse>(DEFAULT_FOLDERS);
    const [variantsMeta, setVariantsMeta] = useState<SavedVariantsCatalogResponse>(DEFAULT_CATALOG);
    const [topView, setTopView] = useState<'all' | 'folders'>('all');
    const [search, setSearchState] = useState('');
    const [sortBy, setSortByState] = useState<VariantSortBy>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPageState] = useState(1);
    const [limit, setLimitState] = useState(DEFAULT_LIMIT);

    const mode = parseMode(searchParams.get('mode'));
    const folderId = parseFolderId(searchParams.get('folderId'));
    const activeView = mode === 'folder'
        ? 'folder'
        : mode === 'unsorted'
            ? 'unsorted'
            : topView;

    const folderViewTitle = useMemo(() => {
        if (mode === 'unsorted') return 'Несортированные';
        if (mode !== 'folder' || !folderId) return 'Варианты';
        return folders.find((folder) => folder.id === folderId)?.name || 'Папка';
    }, [folders, folderId, mode]);

    const variants = variantsMeta.items;

    const updateUrlMode = useCallback((nextMode: VariantListMode, nextFolderId: number | null) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('mode', nextMode);
        if (nextMode === 'folder' && nextFolderId) {
            params.set('folderId', String(nextFolderId));
        } else {
            params.delete('folderId');
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);

    const loadData = useCallback(async () => {
        if (!user || user.role !== 'user') return;

        setError('');
        setIsLoaded(false);

        try {
            const [folderResponse, variantsResponse] = await Promise.all([
                loadSavedVariantFolders({
                    page: activeView === 'folders' ? page : 1,
                    limit: activeView === 'folders' ? limit : 100,
                    search: activeView === 'folders' ? search : undefined,
                    sortBy: (sortBy === 'name' || sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'order')
                        ? sortBy
                        : 'order',
                    sortOrder: activeView === 'folders' ? sortOrder : 'asc',
                }),
                activeView === 'folders'
                    ? Promise.resolve(DEFAULT_CATALOG)
                    : loadSavedVariantsCatalog({
                        page,
                        limit,
                        search,
                        sortBy,
                        sortOrder,
                        mode,
                        folderId: mode === 'folder' ? folderId : undefined,
                    }),
            ]);

            setFolders(folderResponse.items);
            setFoldersMeta(folderResponse);
            setVariantsMeta(variantsResponse);
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить сохранённые варианты');
        } finally {
            setIsLoaded(true);
        }
    }, [activeView, folderId, limit, mode, page, search, sortBy, sortOrder, user]);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user || user.role !== 'user') {
            router.replace('/login');
            return;
        }
        void loadData();
    }, [isAuthLoading, loadData, router, user]);

    const refreshCurrentView = useCallback(async () => {
        await loadData();
    }, [loadData]);

    const setMode = useCallback((nextMode: 'all' | 'folders' | 'unsorted') => {
        setPageState(1);
        if (nextMode === 'folders') {
            setTopView('folders');
            setSortByState('order');
            setSortOrder('asc');
            updateUrlMode('all', null);
            return;
        }

        setTopView('all');
        if (nextMode === 'all') {
            setSortByState('createdAt');
            setSortOrder('desc');
            updateUrlMode('all', null);
            return;
        }
        setSortByState('order');
        setSortOrder('asc');
        updateUrlMode('unsorted', null);
    }, [updateUrlMode]);

    const setFolderMode = useCallback((nextFolderId: number | null) => {
        setTopView('all');
        setPageState(1);
        setSortByState('order');
        setSortOrder('asc');
        if (nextFolderId) {
            updateUrlMode('folder', nextFolderId);
        } else {
            updateUrlMode('unsorted', null);
        }
    }, [updateUrlMode]);

    const setSearch = useCallback((value: string) => {
        setSearchState(value);
        setPageState(1);
    }, []);

    const setSortBy = useCallback((value: VariantSortBy) => {
        setSortByState(value);
        setPageState(1);
    }, []);

    const toggleSortOrder = useCallback(() => {
        setSortOrder((previous) => (previous === 'asc' ? 'desc' : 'asc'));
        setPageState(1);
    }, []);

    const setPage = useCallback((value: number) => {
        setPageState(Math.max(1, value));
    }, []);

    const setLimit = useCallback((value: number) => {
        setLimitState(Math.max(1, value));
        setPageState(1);
    }, []);

    const createFolder = useCallback(async (name: string) => {
        if (!name.trim()) return false;
        setIsSubmitting(true);
        try {
            await createVariantFolder(name.trim());
            await refreshCurrentView();
            return true;
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось создать папку');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [refreshCurrentView]);

    const renameFolder = useCallback(async (targetFolderId: number, nextName: string) => {
        if (!nextName.trim()) return false;
        setIsSubmitting(true);
        try {
            await renameVariantFolder(targetFolderId, nextName.trim());
            await refreshCurrentView();
            return true;
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось переименовать папку');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [refreshCurrentView]);

    const deleteFolder = useCallback(async (targetFolderId: number) => {
        setIsSubmitting(true);
        try {
            await removeVariantFolder(targetFolderId);
            if (mode === 'folder' && folderId === targetFolderId) {
                updateUrlMode('unsorted', null);
            }
            await refreshCurrentView();
            return true;
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось удалить папку');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [folderId, mode, refreshCurrentView, updateUrlMode]);

    const reorderFolder = useCallback(async (targetFolderId: number, direction: 'up' | 'down') => {
        const index = folders.findIndex((folder) => folder.id === targetFolderId);
        if (index < 0) return;
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= folders.length) return;

        const next = [...folders];
        const temp = next[index];
        next[index] = next[swapIndex];
        next[swapIndex] = temp;

        setIsSubmitting(true);
        try {
            await reorderVariantFolders(next.map((folder) => folder.id));
            await refreshCurrentView();
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось изменить порядок папок');
        } finally {
            setIsSubmitting(false);
        }
    }, [folders, refreshCurrentView]);

    const moveVariant = useCallback(async (variantId: string | number, nextFolderId: number | null) => {
        setIsSubmitting(true);
        try {
            await moveVariantToFolder(variantId, nextFolderId);
            await refreshCurrentView();
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось переместить вариант');
        } finally {
            setIsSubmitting(false);
        }
    }, [refreshCurrentView]);

    const reorderVariant = useCallback(async (variantId: string | number, direction: 'up' | 'down') => {
        if (mode === 'all') return;

        const orderedIds = variants.map((item) => Number(item.id));
        const index = orderedIds.findIndex((id) => String(id) === String(variantId));
        if (index < 0) return;
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= orderedIds.length) return;

        const next = [...orderedIds];
        const temp = next[index];
        next[index] = next[swapIndex];
        next[swapIndex] = temp;

        setIsSubmitting(true);
        try {
            const currentFolderId = mode === 'folder' ? folderId : null;
            await reorderVariantsInContainer(next, currentFolderId);
            await refreshCurrentView();
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось изменить порядок вариантов');
        } finally {
            setIsSubmitting(false);
        }
    }, [folderId, mode, refreshCurrentView, variants]);

    const deleteVariant = useCallback(async (variantId: string | number) => {
        setIsSubmitting(true);
        try {
            await removeSavedVariant(variantId);
            await refreshCurrentView();
            return true;
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось удалить вариант');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [refreshCurrentView]);

    return {
        user,
        isAuthLoading,
        isLoaded,
        isSubmitting,
        error,
        mode,
        activeView,
        folderId,
        folders,
        foldersMeta,
        variants,
        variantsMeta,
        folderViewTitle,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
        setMode,
        setFolderMode,
        setSearch,
        setSortBy,
        toggleSortOrder,
        setPage,
        setLimit,
        refreshCurrentView,
        createFolder,
        renameFolder,
        deleteFolder,
        reorderFolder,
        moveVariant,
        reorderVariant,
        deleteVariant,
    };
};
