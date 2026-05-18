import { fetchKnowledgeBase } from '@/lib/knowledgeBaseApi';
import { consumeVariantExportQuota, getVariantExportQuota } from '@/lib/variantsApi';
import type {
    AuthorVariantExportConsumeResult,
    AuthorVariantExportQuotaState,
    AuthorVariantKnowledgeBaseData,
} from '@/types/api/authorVariant';

export const loadAuthorVariantKnowledgeBase = async (): Promise<AuthorVariantKnowledgeBaseData> => {
    return fetchKnowledgeBase();
};

export const loadAuthorVariantExportQuota = async (): Promise<Exclude<AuthorVariantExportQuotaState, null>> => {
    return getVariantExportQuota();
};

export const consumeAuthorVariantExportQuota = async (): Promise<AuthorVariantExportConsumeResult> => {
    return consumeVariantExportQuota();
};
