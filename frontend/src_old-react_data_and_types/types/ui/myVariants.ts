import type { AuthUser } from '@/lib/authApi';
import type { MyVariantsSavedRecord, MyVariantsSavedRecordId } from '@/types/api/myVariants';

export interface MyVariantsRichTextBlockProps {
    value?: string;
    fallback: string;
    className?: string;
    as?: 'div' | 'span';
}

export interface MySavedVariantPreviewProps {
    saved: MyVariantsSavedRecord;
    onDelete: (id: MyVariantsSavedRecordId) => Promise<boolean>;
}

export interface UseMyVariantsPageResult {
    user: AuthUser | null;
    isAuthLoading: boolean;
    isLoaded: boolean;
    error: string;
    variants: MyVariantsSavedRecord[];
    goToGenerator: () => void;
    handleDeleteVariant: (id: MyVariantsSavedRecordId) => Promise<boolean>;
}
