import type { VariantExportQuota } from '@/lib/variantsApi';
import type { SavedVariantRecord } from '@/types/testVariant';

export type MyVariantDetailsSavedVariant = SavedVariantRecord | null;

export type MyVariantDetailsExportQuota = VariantExportQuota | null;

export interface MyVariantDetailsConsumeExportResult {
    quota: VariantExportQuota;
    source: 'free' | 'paid';
}
