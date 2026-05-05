import type { AuthUser } from '@/lib/authApi';
import type { MyVariantDetailsExportQuota, MyVariantDetailsSavedVariant } from '@/types/api/myVariantDetails';
import type { SavedVariantRecord } from '@/types/testVariant';

export interface MyVariantDetailsRichTextBlockProps {
    value?: string;
    fallback: string;
    className?: string;
    as?: 'div' | 'span';
}

export interface MyVariantDetailsNotFoundProps {
    error: string;
    onGoToVariants: () => void;
    onGoToGenerator: () => void;
}

export interface MyVariantDetailsContentProps {
    savedVariant: SavedVariantRecord;
    exportQuota: MyVariantDetailsExportQuota;
    onPrint: () => Promise<void>;
    onDownload: () => Promise<void>;
}

export interface UseMyVariantDetailsPageResult {
    user: AuthUser | null;
    isAuthLoading: boolean;
    savedVariant: MyVariantDetailsSavedVariant;
    isLoaded: boolean;
    error: string;
    exportQuota: MyVariantDetailsExportQuota;
    handleDownload: () => Promise<void>;
    handlePrint: () => Promise<void>;
    goToVariants: () => void;
    goToGenerator: () => void;
}
