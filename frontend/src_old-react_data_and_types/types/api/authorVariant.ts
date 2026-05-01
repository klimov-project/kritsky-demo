import type { AuthUser } from '@/lib/authApi';
import type { KnowledgeBaseResponse } from '@/lib/knowledgeBaseApi';
import type { VariantExportQuota } from '@/lib/variantsApi';

export interface ActivatableEntry {
    isActive?: boolean;
}

export interface AuthorVariantFeedbackPayload {
    name: string;
    email: string;
    comment: string;
}

export type AuthorVariantUser = AuthUser | null;

export type AuthorVariantKnowledgeBaseData = KnowledgeBaseResponse;

export type AuthorVariantExportQuotaState = VariantExportQuota | null;

export interface AuthorVariantExportConsumeResult {
    quota: VariantExportQuota;
    source: 'free' | 'paid';
}
