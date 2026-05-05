import { getAdminSavedVariant } from '@/lib/adminApi';
import type { AdminUserVariantLoadResult } from '@/types/api/adminUserVariant';
import type { SavedVariantRecord } from '@/types/testVariant';

export const loadAdminUserVariant = async (variantId: number): Promise<AdminUserVariantLoadResult> => {
    const savedVariant = await getAdminSavedVariant(variantId) as SavedVariantRecord;
    return { savedVariant };
};
