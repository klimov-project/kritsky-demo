import { requestJson, requestJsonAuth } from '@/lib/http';
import type { SavedVariantRecord } from '@/types/testVariant';
import type { GeneratedVariant, Task1Filters } from '@/types/testVariant';

interface SavedVariantDto {
    id: number;
    createdAt: string;
    updatedAt: string;
    folderId?: number | null;
    folderName?: string | null;
    orderIndex?: number;
    displayName?: string;
    variant: SavedVariantRecord['variant'];
    settings: SavedVariantRecord['settings'];
}

interface SavedVariantsListDto {
    items: SavedVariantDto[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    mode?: VariantListMode;
    folderId?: number | null;
    search?: string | null;
    sortBy?: VariantSortBy;
    sortOrder?: SortOrder;
}

export type VariantListMode = 'all' | 'folder' | 'unsorted';
export type VariantSortBy = 'order' | 'createdAt' | 'updatedAt' | 'name';
export type FolderSortBy = 'order' | 'createdAt' | 'updatedAt' | 'name' | 'variantsCount';
export type SortOrder = 'asc' | 'desc';

export interface ListSavedVariantsParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: VariantSortBy;
    sortOrder?: SortOrder;
    mode?: VariantListMode;
    folderId?: number | null;
}

export interface SavedVariantsCatalogResponse {
    items: SavedVariantRecord[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    mode: VariantListMode;
    folderId: number | null;
    search: string;
    sortBy: VariantSortBy;
    sortOrder: SortOrder;
}

export interface SavedVariantFolder {
    id: number;
    userId: number;
    name: string;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
    variantsCount: number;
    link: string;
}

interface SavedVariantFolderDto {
    id: number;
    userId: number;
    name: string;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
    variantsCount: number;
    link: string;
}

interface SavedVariantFolderListDto {
    items: SavedVariantFolderDto[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    search?: string | null;
    sortBy?: FolderSortBy;
    sortOrder?: SortOrder;
}

export interface ListSavedVariantFoldersParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: FolderSortBy;
    sortOrder?: SortOrder;
}

export interface SavedVariantFoldersResponse {
    items: SavedVariantFolder[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    search: string;
    sortBy: FolderSortBy;
    sortOrder: SortOrder;
}

export interface VariantExportQuota {
    hasActiveSubscription: boolean;
    dailyFreeLimit: number;
    dailyFreeUsed: number;
    dailyFreeRemaining: number;
    paidDownloadsRemaining: number;
}

interface ConsumeVariantExportDto {
    quota: VariantExportQuota;
    source: 'free' | 'paid';
}

interface RuntimeVariantResponseDto {
    variant: GeneratedVariant;
    evaluation: Record<string, unknown>;
}

export interface RuntimeVariantRequestPayload {
    selectedWorkId?: string;
    selectedExcerptId?: string;
    selectedPoetId?: string;
    selectedPoemId?: string;
    selectedThemeId?: string;
    selectedBlock3AuthorId?: string;
    task1Filters?: Task1Filters;
    block11RodPreference?: Record<string, string>;
}

export type RuntimeVariantTaskKey =
    | 'task1'
    | 'task2'
    | 'task3'
    | 'task4_1'
    | 'task4_2'
    | 'task5'
    | 'task6'
    | 'task7'
    | 'task8'
    | 'task9_1'
    | 'task9_2'
    | 'task10'
    | 'task11_1'
    | 'task11_2'
    | 'task11_3'
    | 'task11_4'
    | 'task11_5';

export type RuntimeVariantBlockKey = 'block1' | 'block2' | 'block3';

const normalizeNbspText = (value: string): string => value
    .replace(/&nbsp;?/giu, ' ')
    .replace(/\u00A0/gu, ' ');

const normalizeNbspDeep = (value: unknown): unknown => {
    if (typeof value === 'string') {
        return normalizeNbspText(value);
    }

    if (Array.isArray(value)) {
        return value.map((entry) => normalizeNbspDeep(entry));
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [key, normalizeNbspDeep(entry)]),
        );
    }

    return value;
};

const toRecord = (item: SavedVariantDto): SavedVariantRecord => ({
    id: String(item.id),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    folderId: item.folderId ?? null,
    folderName: item.folderName ?? null,
    orderIndex: item.orderIndex ?? 0,
    displayName: item.displayName || '',
    variant: normalizeNbspDeep(item.variant) as SavedVariantRecord['variant'],
    settings: normalizeNbspDeep(item.settings) as SavedVariantRecord['settings'],
});

const toFolder = (item: SavedVariantFolderDto): SavedVariantFolder => ({
    id: item.id,
    userId: item.userId,
    name: item.name,
    orderIndex: item.orderIndex,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    variantsCount: item.variantsCount,
    link: item.link,
});

export const listSavedVariants = async (): Promise<SavedVariantRecord[]> => {
    const response = await listSavedVariantsCatalog();
    return response.items;
};

const buildQueryString = (payload: Record<string, string | number | null | undefined>): string => {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        params.set(key, String(value));
    });
    const encoded = params.toString();
    return encoded ? `?${encoded}` : '';
};

export const listSavedVariantsCatalog = async (
    params: ListSavedVariantsParams = {},
): Promise<SavedVariantsCatalogResponse> => {
    const response = await requestJsonAuth<SavedVariantsListDto>(
        `/api/variants${buildQueryString({
            page: params.page,
            limit: params.limit,
            search: params.search?.trim(),
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
            mode: params.mode,
            folderId: params.folderId ?? undefined,
        })}`,
    );

    return {
        items: response.items.map(toRecord),
        page: response.page ?? params.page ?? 1,
        limit: response.limit ?? params.limit ?? 20,
        total: response.total ?? response.items.length,
        totalPages: response.totalPages ?? 1,
        mode: response.mode ?? params.mode ?? 'all',
        folderId: response.folderId ?? params.folderId ?? null,
        search: response.search ?? params.search ?? '',
        sortBy: response.sortBy ?? params.sortBy ?? 'createdAt',
        sortOrder: response.sortOrder ?? params.sortOrder ?? 'desc',
    };
};

export const getSavedVariantById = async (variantId: string | number): Promise<SavedVariantRecord> => {
    const response = await requestJsonAuth<SavedVariantDto>(`/api/variants/${variantId}`);
    return toRecord(response);
};

export const saveVariant = async (payload: {
    variant: SavedVariantRecord['variant'];
    settings: SavedVariantRecord['settings'];
    folderId?: number | null;
}): Promise<SavedVariantRecord> => {
    const response = await requestJsonAuth<SavedVariantDto>('/api/variants', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return toRecord(response);
};

export const deleteSavedVariant = async (variantId: string | number): Promise<void> => {
    await requestJsonAuth<{ ok: boolean }>(`/api/variants/${variantId}`, {
        method: 'DELETE',
    });
};

export const listSavedVariantFolders = async (
    params: ListSavedVariantFoldersParams = {},
): Promise<SavedVariantFoldersResponse> => {
    const response = await requestJsonAuth<SavedVariantFolderListDto>(
        `/api/variants/folders${buildQueryString({
            page: params.page,
            limit: params.limit,
            search: params.search?.trim(),
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
        })}`,
    );

    return {
        items: response.items.map(toFolder),
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
        search: response.search ?? params.search ?? '',
        sortBy: response.sortBy ?? params.sortBy ?? 'order',
        sortOrder: response.sortOrder ?? params.sortOrder ?? 'asc',
    };
};

export const createSavedVariantFolder = async (name: string): Promise<SavedVariantFolder> => {
    const response = await requestJsonAuth<SavedVariantFolderDto>('/api/variants/folders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
    return toFolder(response);
};

export const renameSavedVariantFolder = async (folderId: number, name: string): Promise<SavedVariantFolder> => {
    const response = await requestJsonAuth<SavedVariantFolderDto>(`/api/variants/folders/${folderId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
    return toFolder(response);
};

export const deleteSavedVariantFolder = async (folderId: number): Promise<{ ok: boolean; deleted: boolean }> => {
    return requestJsonAuth<{ ok: boolean; deleted: boolean }>(`/api/variants/folders/${folderId}`, {
        method: 'DELETE',
    });
};

export const reorderSavedVariantFolders = async (folderIds: number[]): Promise<SavedVariantFoldersResponse> => {
    const response = await requestJsonAuth<SavedVariantFolderListDto>('/api/variants/folders/reorder', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderIds }),
    });
    return {
        items: response.items.map(toFolder),
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
        search: response.search ?? '',
        sortBy: response.sortBy ?? 'order',
        sortOrder: response.sortOrder ?? 'asc',
    };
};

export const moveSavedVariantToFolder = async (
    variantId: string | number,
    folderId: number | null,
    position?: number,
): Promise<SavedVariantRecord> => {
    const response = await requestJsonAuth<SavedVariantDto>(`/api/variants/${variantId}/folder`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId, position }),
    });
    return toRecord(response);
};

export const reorderSavedVariants = async (
    variantIds: number[],
    folderId: number | null,
): Promise<SavedVariantsCatalogResponse> => {
    const response = await requestJsonAuth<SavedVariantsListDto>('/api/variants/reorder', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId, variantIds }),
    });
    return {
        items: response.items.map(toRecord),
        page: response.page ?? 1,
        limit: response.limit ?? variantIds.length,
        total: response.total ?? response.items.length,
        totalPages: response.totalPages ?? 1,
        mode: response.mode ?? (folderId === null ? 'unsorted' : 'folder'),
        folderId: response.folderId ?? folderId,
        search: response.search ?? '',
        sortBy: response.sortBy ?? 'order',
        sortOrder: response.sortOrder ?? 'asc',
    };
};

export const getVariantExportQuota = async (): Promise<VariantExportQuota> => {
    return requestJsonAuth<VariantExportQuota>('/api/variants/export/quota');
};

export const consumeVariantExportQuota = async (
    savedVariantId?: number | string,
    action: 'download' | 'print' = 'download',
): Promise<ConsumeVariantExportDto> => {
    return requestJsonAuth<ConsumeVariantExportDto>('/api/variants/export/quota/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            savedVariantId: savedVariantId ? Number(savedVariantId) : null,
            action,
        }),
    });
};

export const generateRuntimeVariant = async (
    payload: RuntimeVariantRequestPayload & { useSelected: boolean },
): Promise<RuntimeVariantResponseDto> => {
    const response = await requestJson<RuntimeVariantResponseDto>('/api/variants/runtime/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return normalizeNbspDeep(response) as RuntimeVariantResponseDto;
};

export const getPregeneratedVariant = async (): Promise<RuntimeVariantResponseDto> => {
    const response = await requestJson<RuntimeVariantResponseDto>('/api/variants/runtime/pregenerated');
    return normalizeNbspDeep(response) as RuntimeVariantResponseDto;
};

export const refreshRuntimeVariantBlock = async (
    payload: RuntimeVariantRequestPayload & {
        block: RuntimeVariantBlockKey;
        variant: GeneratedVariant;
        pinnedBlock3Tasks?: Record<string, unknown>;
        replaceConflictingPoem?: boolean;
    },
): Promise<RuntimeVariantResponseDto> => {
    const response = await requestJson<RuntimeVariantResponseDto>('/api/variants/runtime/refresh-block', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return normalizeNbspDeep(response) as RuntimeVariantResponseDto;
};

export const refreshRuntimeVariantTask = async (
    payload: Pick<RuntimeVariantRequestPayload, 'selectedThemeId' | 'selectedBlock3AuthorId' | 'task1Filters'> & {
        taskKey: RuntimeVariantTaskKey;
        variant: GeneratedVariant;
        task2Action?: 'full' | 'reroll' | 'properties' | 'character' | 'property';
        task2PairIndex?: number;
        excludedTaskIds?: string[];
    },
): Promise<RuntimeVariantResponseDto> => {
    const response = await requestJson<RuntimeVariantResponseDto>('/api/variants/runtime/refresh-task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return normalizeNbspDeep(response) as RuntimeVariantResponseDto;
};
