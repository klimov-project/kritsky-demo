import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { createAdminBook, deleteAdminBookById, loadAdminBooksData, updateAdminBookById } from '@/lib/api/adminBooks';
import type { CollectionAuthorOption, CollectionKind, ProductRecord } from '@/types/api/adminBooks';
import type { ProductCategoryKey, ProductFulfillment } from '@/types/shop';
import { buildShopBookPayload, getDraftStateFromProduct, getSelectedCollectionAuthorName } from '@/utils/adminBooks';

const PAGE_SIZE = 5;

export const useAdminBooksPage = () => {
    const initialDraftState = getDraftStateFromProduct(null);

    const [products, setProducts] = useState<ProductRecord[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [collectionAuthors, setCollectionAuthors] = useState<CollectionAuthorOption[]>([]);

    const [draftCategory, setDraftCategory] = useState<ProductCategoryKey>(initialDraftState.category);
    const [draftFulfillment, setDraftFulfillment] = useState<ProductFulfillment>(initialDraftState.fulfillment);
    const [draftCollectionAuthorId, setDraftCollectionAuthorId] = useState(initialDraftState.collectionAuthorId);
    const [draftCollectionKind, setDraftCollectionKind] = useState<CollectionKind>(initialDraftState.collectionKind);
    const [draftDownloadPackCount, setDraftDownloadPackCount] = useState(initialDraftState.downloadPackCount);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setError('');
            setIsLoading(true);
            try {
                const data = await loadAdminBooksData();
                if (!cancelled) {
                    setProducts(data.products);
                    setCollectionAuthors(data.collectionAuthors);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить товары');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!isEditModalOpen) return;

        const draftState = getDraftStateFromProduct(selectedProduct);
        setDraftCategory(draftState.category);
        setDraftFulfillment(draftState.fulfillment);
        setDraftCollectionAuthorId(draftState.collectionAuthorId);
        setDraftCollectionKind(draftState.collectionKind);
        setDraftDownloadPackCount(draftState.downloadPackCount);
    }, [isEditModalOpen, selectedProduct]);

    useEffect(() => {
        if (draftCategory === 'collections') {
            setDraftFulfillment('DIGITAL');
            if (!draftCollectionAuthorId && collectionAuthors.length) {
                setDraftCollectionAuthorId(collectionAuthors[0].authorId);
            }
        }
        if (draftCategory === 'download_packs') {
            setDraftFulfillment('DIGITAL');
        }
    }, [collectionAuthors, draftCategory, draftCollectionAuthorId]);

    const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageData = useMemo(
        () => products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [currentPage, products],
    );

    const isCollectionCategory = draftCategory === 'collections';
    const isDownloadPackCategory = draftCategory === 'download_packs';
    const isAuthorCollection = isCollectionCategory && draftCollectionKind === 'author_1_5';

    const selectedCollectionAuthorName = useMemo(
        () => getSelectedCollectionAuthorName(collectionAuthors, draftCollectionAuthorId, selectedProduct),
        [collectionAuthors, draftCollectionAuthorId, selectedProduct],
    );

    const openCreateModal = () => {
        setSelectedProduct(null);
        setIsEditModalOpen(true);
    };

    const openEditModal = (product: ProductRecord) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (product: ProductRecord) => {
        setSelectedProduct(product);
        setIsConfirmDeleteOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
    };

    const closeDeleteModal = () => {
        setIsConfirmDeleteOpen(false);
    };

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);

        try {
            const payload = buildShopBookPayload(formData, selectedProduct || undefined);

            if (selectedProduct) {
                const updated = await updateAdminBookById(selectedProduct.id, payload);
                setProducts((previousProducts) =>
                    previousProducts.map((item) => (item.id === selectedProduct.id ? updated : item)),
                );
            } else {
                const created = await createAdminBook(payload);
                setProducts((previousProducts) => [created, ...previousProducts]);
                setPage(1);
            }

            closeEditModal();
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось сохранить товар');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedProduct) return;

        setError('');
        setIsSubmitting(true);

        try {
            await deleteAdminBookById(selectedProduct.id);
            setProducts((previousProducts) => previousProducts.filter((item) => item.id !== selectedProduct.id));
            setIsConfirmDeleteOpen(false);
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось удалить товар');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        error,
        isLoading,
        isSubmitting,
        isEditModalOpen,
        isConfirmDeleteOpen,
        selectedProduct,
        collectionAuthors,
        pageData,
        currentPage,
        totalPages,
        draftCategory,
        draftFulfillment,
        draftCollectionAuthorId,
        draftCollectionKind,
        draftDownloadPackCount,
        isCollectionCategory,
        isDownloadPackCategory,
        isAuthorCollection,
        selectedCollectionAuthorName,
        setPage,
        setDraftCategory,
        setDraftFulfillment,
        setDraftCollectionAuthorId,
        setDraftCollectionKind,
        setDraftDownloadPackCount,
        openCreateModal,
        openEditModal,
        openDeleteModal,
        closeEditModal,
        closeDeleteModal,
        handleSave,
        handleConfirmDelete,
    };
};
