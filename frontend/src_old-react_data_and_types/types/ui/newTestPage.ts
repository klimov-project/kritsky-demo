import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { Work } from '@/mocks/materials';

export type SelectFieldOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

export interface SelectFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectFieldOption[];
    placeholder?: string;
}

export interface RichTextBlockProps {
    value?: string;
    fallback?: string;
    className?: string;
    as?: 'div' | 'span';
}

export interface CollapsibleInstructionProps {
    value?: string;
    fallback: string;
    collapsible?: boolean;
}

export interface QuestionNumberBadgeProps {
    label: string;
}

export interface QuestionActionsProps {
    onRefresh: () => void;
    onBack: () => void;
    disableBack: boolean;
    disableRefresh?: boolean;
    isRefreshing?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    children?: ReactNode;
    isLocked?: boolean;
    onCheck?: () => void;
    isAnswerChecked?: boolean;
}

export interface DockButtonProps {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    fullWidth?: boolean;
}

export interface AdminIdBadgeProps {
    id?: string | number;
    extra?: string;
}

export type NewTestAdminTaskMetaTask = {
    id?: string | number;
    rodId?: string;
    authorId?: string;
    authorIds?: string | string[];
    tags?: string | string[];
    tag?: string | string[];
    special?: boolean;
};

export interface AdminTaskMetaProps {
    task: NewTestAdminTaskMetaTask | null | undefined;
    showRod?: boolean;
    taskKey?: string;
    pinned?: boolean;
    pinConflict?: string | null;
    onPin?: () => void;
    onUnpin?: () => void;
    onSelect?: () => void;
}

export type NewTestWorkWithExcerpts = Pick<Work, 'excerpts'>;

export interface NewTestSelectModalState {
    taskKey: string;
    inputValue: string;
    inputValue2: string;
    error: string;
}

export type NewTestSelectModalSetter = Dispatch<SetStateAction<NewTestSelectModalState | null>>;
