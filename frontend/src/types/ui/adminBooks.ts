import type React from 'react';

import type { CollectionAuthorOption, CollectionKind, ProductRecord } from '@/types/api/adminBooks';
import type { ProductCategoryKey, ProductFulfillment } from '@/types/shop';

export interface AdminBooksTableColumn {
    header: string;
    accessor: keyof ProductRecord | ((product: ProductRecord) => React.ReactNode);
    className?: string;
}

export interface AdminBooksProductsTableProps {
    data: ProductRecord[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onEdit: (product: ProductRecord) => void;
    onDelete: (product: ProductRecord) => void;
}

export interface AdminBookFormDraftState {
    category: ProductCategoryKey;
    fulfillment: ProductFulfillment;
    collectionAuthorId: string;
    collectionKind: CollectionKind;
    downloadPackCount: string;
}

export interface AdminBookFormDraftHandlers {
    onCategoryChange: (value: ProductCategoryKey) => void;
    onFulfillmentChange: (value: ProductFulfillment) => void;
    onCollectionAuthorChange: (value: string) => void;
    onCollectionKindChange: (value: CollectionKind) => void;
    onDownloadPackCountChange: (value: string) => void;
}

export interface AdminBookFormFlags {
    isCollectionCategory: boolean;
    isDownloadPackCategory: boolean;
    isAuthorCollection: boolean;
    selectedCollectionAuthorName: string;
}

export interface AdminBookFormProps {
    selectedProduct: ProductRecord | null;
    collectionAuthors: CollectionAuthorOption[];
    flags: AdminBookFormFlags;
    draftState: AdminBookFormDraftState;
    draftHandlers: AdminBookFormDraftHandlers;
    onSubmit: React.FormEventHandler<HTMLFormElement>;
}
