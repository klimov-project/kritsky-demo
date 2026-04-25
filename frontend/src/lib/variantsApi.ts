import { requestJson, requestJsonAuth } from '@/lib/http';
import type { SavedVariantRecord } from '@/types/testVariant';
import type { GeneratedVariant, Task1Filters } from '@/types/testVariant';

interface SavedVariantDto {
    id: number;
    createdAt: string;
    updatedAt: string;
    variant: SavedVariantRecord['variant'];
    settings: SavedVariantRecord['settings'];
}

interface SavedVariantsListDto {
    items: SavedVariantDto[];
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
    variant: normalizeNbspDeep(item.variant) as SavedVariantRecord['variant'],
    settings: normalizeNbspDeep(item.settings) as SavedVariantRecord['settings'],
});

export const listSavedVariants = async (): Promise<SavedVariantRecord[]> => {
    const response = await requestJsonAuth<SavedVariantsListDto>('/api/variants');
    return response.items.map(toRecord);
};

export const getSavedVariantById = async (variantId: string | number): Promise<SavedVariantRecord> => {
    const response = await requestJsonAuth<SavedVariantDto>(`/api/variants/${variantId}`);
    return toRecord(response);
};

export const saveVariant = async (payload: {
    variant: SavedVariantRecord['variant'];
    settings: SavedVariantRecord['settings'];
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

// --- V2 Endpoints (SQL-backed) ---

export const generateRuntimeVariantV2 = async (
    payload: RuntimeVariantRequestPayload & { useSelected: boolean },
): Promise<RuntimeVariantResponseDto> => {
    const response = await requestJson<RuntimeVariantResponseDto>('/api/variants/runtime/generate-v2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return normalizeNbspDeep(response) as RuntimeVariantResponseDto;
};

export const getPregeneratedVariantV2 = async (): Promise<RuntimeVariantResponseDto> => {
    const response = await requestJson<RuntimeVariantResponseDto>('/api/variants/runtime/pregenerated-v2');
    return normalizeNbspDeep(response) as RuntimeVariantResponseDto;
};

export const refreshRuntimeVariantBlockV2 = async (
    payload: RuntimeVariantRequestPayload & {
        block: RuntimeVariantBlockKey;
        variant: GeneratedVariant;
        pinnedBlock3Tasks?: Record<string, unknown>;
        replaceConflictingPoem?: boolean;
    },
): Promise<RuntimeVariantResponseDto> => {
    const response = await requestJson<RuntimeVariantResponseDto>('/api/variants/runtime/refresh-block-v2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return normalizeNbspDeep(response) as RuntimeVariantResponseDto;
};

export const refreshRuntimeVariantTaskV2 = async (
    payload: Pick<RuntimeVariantRequestPayload, 'selectedThemeId' | 'selectedBlock3AuthorId' | 'task1Filters'> & {
        taskKey: RuntimeVariantTaskKey;
        variant: GeneratedVariant;
        task2Action?: 'full' | 'reroll' | 'properties' | 'character' | 'property';
        task2PairIndex?: number;
        excludedTaskIds?: string[];
    },
): Promise<RuntimeVariantResponseDto> => {
    const response = await requestJson<RuntimeVariantResponseDto>('/api/variants/runtime/refresh-task-v2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return normalizeNbspDeep(response) as RuntimeVariantResponseDto;
};

