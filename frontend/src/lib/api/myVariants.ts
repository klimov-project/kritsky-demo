import { deleteSavedVariant, listSavedVariants } from '@/lib/variantsApi';
import type { MyVariantsSavedRecord, MyVariantsSavedRecordId } from '@/types/api/myVariants';

export const loadMySavedVariants = async (): Promise<MyVariantsSavedRecord[]> => {
    return listSavedVariants();
};

export const removeMySavedVariant = async (id: MyVariantsSavedRecordId): Promise<void> => {
    await deleteSavedVariant(id);
};
