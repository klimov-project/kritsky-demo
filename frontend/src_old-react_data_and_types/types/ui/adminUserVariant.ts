import type { MatchingQuestion } from '@/mocks/materials';
import type { GeneratedVariant, SavedVariantRecord } from '@/types/testVariant';

export interface AdminUserVariantViewContentProps {
    savedVariant: SavedVariantRecord;
    onBack: () => void;
}

export interface AdminUserVariantRichTextProps {
    value?: string;
    fallback: string;
    className?: string;
    as?: 'div' | 'span';
}

export interface AdminUserVariantTaskIdBadgeProps {
    id?: string | number;
    extra?: string;
}

export type AdminUserVariantPartThreeTask =
    | GeneratedVariant['task11_1']
    | GeneratedVariant['task11_2']
    | GeneratedVariant['task11_3']
    | GeneratedVariant['task11_4']
    | GeneratedVariant['task11_5'];

export type AdminUserVariantTaskWithTags =
    | { tags?: unknown; tag?: unknown }
    | null
    | undefined;

export type AdminUserVariantTaskTwo = MatchingQuestion | null;
