import {
    createSavedVariantFolder,
    deleteSavedVariant,
    deleteSavedVariantFolder,
    listSavedVariantFolders,
    listSavedVariantsCatalog,
    moveSavedVariantToFolder,
    renameSavedVariantFolder,
    reorderSavedVariantFolders,
    reorderSavedVariants,
    type ListSavedVariantFoldersParams,
    type ListSavedVariantsParams,
    type SavedVariantFolder,
    type SavedVariantFoldersResponse,
    type SavedVariantsCatalogResponse,
} from '@/lib/variantsApi';

export const loadSavedVariantsCatalog = async (
    params: ListSavedVariantsParams,
): Promise<SavedVariantsCatalogResponse> => {
    return listSavedVariantsCatalog(params);
};

export const loadSavedVariantFolders = async (
    params: ListSavedVariantFoldersParams,
): Promise<SavedVariantFoldersResponse> => {
    return listSavedVariantFolders(params);
};

export const createVariantFolder = async (name: string): Promise<SavedVariantFolder> => {
    return createSavedVariantFolder(name);
};

export const renameVariantFolder = async (folderId: number, name: string): Promise<SavedVariantFolder> => {
    return renameSavedVariantFolder(folderId, name);
};

export const removeVariantFolder = async (folderId: number): Promise<{ ok: boolean; deleted: boolean }> => {
    return deleteSavedVariantFolder(folderId);
};

export const moveVariantToFolder = async (
    variantId: string | number,
    folderId: number | null,
    position?: number,
) => {
    return moveSavedVariantToFolder(variantId, folderId, position);
};

export const reorderVariantFolders = async (folderIds: number[]): Promise<SavedVariantFoldersResponse> => {
    return reorderSavedVariantFolders(folderIds);
};

export const reorderVariantsInContainer = async (
    variantIds: number[],
    folderId: number | null,
): Promise<SavedVariantsCatalogResponse> => {
    return reorderSavedVariants(variantIds, folderId);
};

export const removeSavedVariant = async (variantId: string | number): Promise<void> => {
    await deleteSavedVariant(variantId);
};
