import type React from 'react';

import type { AuthorVariantFeedbackPayload, AuthorVariantUser } from '@/types/api/authorVariant';
import type { KnowledgeBaseSettings } from '@/mocks/materials';
import type { GeneratedVariant } from '@/types/testVariant';

export interface AuthorVariantRichTextBlockProps {
    value?: string;
    fallback: string;
    className?: string;
    as?: 'div' | 'span';
}

export interface AuthorVariantCollapsibleInstructionProps {
    value?: string;
    fallback: string;
}

export interface AuthorVariantDockButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    fullWidth?: boolean;
}

export interface AuthorVariantContentProps {
    variant: GeneratedVariant;
    settings: KnowledgeBaseSettings;
    showAnswers: boolean;
}

export interface AuthorVariantActionDockProps {
    showAnswers: boolean;
    isMobileDockOpen: boolean;
    quotaCaption: string;
    statusMessage: string;
    isDownloadingPdf: boolean;
    onToggleAnswers: () => void;
    onToggleMobileDock: () => void;
    onDownload: () => void;
    onPrint: () => void;
    onOpenFeedback: () => void;
}

export interface UseAuthorVariantPageOptions {
    user: AuthorVariantUser;
}

export interface UseAuthorVariantPageResult {
    variant: GeneratedVariant | null;
    settings: KnowledgeBaseSettings;
    isLoading: boolean;
    error: string;
    showAnswers: boolean;
    showFeedbackModal: boolean;
    isMobileDockOpen: boolean;
    statusMessage: string;
    isDownloadingPdf: boolean;
    quotaCaption: string;
    openFeedbackModal: () => void;
    closeFeedbackModal: () => void;
    toggleAnswers: () => void;
    toggleMobileDock: () => void;
    handleDownload: () => Promise<void>;
    handlePrint: () => Promise<void>;
    handleSendFeedback: (payload: AuthorVariantFeedbackPayload) => Promise<void>;
}
