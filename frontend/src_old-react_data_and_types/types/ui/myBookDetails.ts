import type { AuthUser } from '@/lib/authApi';
import type {
    MyBookDetailsGeneratedPack,
    MyBookDetailsGeneratedVariant,
    MyBookDetailsPurchase,
    MyBookDetailsRevealedAnswers,
} from '@/types/api/myBookDetails';
import type { PurchasedItem } from '@/types/shop';

export interface UseMyBookDetailsPageResult {
    user: AuthUser | null;
    isAuthLoading: boolean;
    purchase: MyBookDetailsPurchase;
    isPageLoading: boolean;
    error: string;
    revealedAnswers: MyBookDetailsRevealedAnswers;
    toggleAnswers: (variantId: string) => void;
    handlePrint: () => void;
    handleDownloadPdf: () => void;
    goToMyBooks: () => void;
    goToShopProduct: (bookId: string) => void;
}

export interface MyBookGeneratedVariantCardProps {
    variant: MyBookDetailsGeneratedVariant;
    isAnswerRevealed: boolean;
    onToggleAnswers: (variantId: string) => void;
    excerptHtml: string;
}

export interface MyBookGeneratedCollectionSectionProps {
    packs: MyBookDetailsGeneratedPack[];
    purchaseQuantity: number;
    authorName: string;
    revealedAnswers: MyBookDetailsRevealedAnswers;
    onToggleAnswers: (variantId: string) => void;
    onDownloadPdf: () => void;
    onPrint: () => void;
}

export interface MyBookDetailsNotFoundProps {
    error: string;
    onGoToMyBooks: () => void;
}

export interface MyBookDetailsContentProps {
    purchase: PurchasedItem;
    revealedAnswers: MyBookDetailsRevealedAnswers;
    onToggleAnswers: (variantId: string) => void;
    onPrint: () => void;
    onDownloadPdf: () => void;
    onGoToShopProduct: (bookId: string) => void;
}
