import { consumeVariantExportQuota, getSavedVariantById, getVariantExportQuota } from '@/lib/variantsApi';
import type { MyVariantDetailsConsumeExportResult } from '@/types/api/myVariantDetails';
import type { SavedVariantRecord } from '@/types/testVariant';

export const loadMyVariantDetailsById = async (variantId: string): Promise<SavedVariantRecord> => {
    return getSavedVariantById(variantId);
};

export const loadMyVariantDetailsExportQuota = async () => {
    return getVariantExportQuota();
};

export const consumeMyVariantDetailsExportQuota = async (
    savedVariantId: string | number,
    action: 'download' | 'print',
): Promise<MyVariantDetailsConsumeExportResult> => {
    return consumeVariantExportQuota(savedVariantId, action);
};
