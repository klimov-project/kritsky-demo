'use client';

import { IoAddOutline } from 'react-icons/io5';

import AdminBookForm from '@/components/admin/books/AdminBookForm';
import AdminBooksProductsTable from '@/components/admin/books/AdminBooksProductsTable';
import AdminModal from '@/components/admin/AdminModal';
import ConfirmationModal from '@/components/admin/AdminModal/ConfirmationModal';
import AdminLayout from '@/components/layout/AdminLayout';
import Button from '@/components/shared/Button';
import { useAdminBooksPage } from '@/hooks/useAdminBooksPage';

export default function AdminBooksPage() {
    const {
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
    } = useAdminBooksPage();
    const deleteMessage = selectedProduct
        ? `Вы действительно хотите удалить товар "${selectedProduct.title}"? Это действие необратимо.`
        : 'Вы действительно хотите удалить этот товар? Это действие необратимо.';

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <Button
                    variant="outlined"
                    className="flex items-center gap-2 h-[48px]"
                    onClick={openCreateModal}
                >
                    <IoAddOutline size={20} /> Добавить товар
                </Button>
            </div>

            {!isLoading && error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
            )}

            {isLoading ? (
                <div className="text-sm opacity-60">Загружаю товары...</div>
            ) : (
                <AdminBooksProductsTable
                    data={pageData}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                />
            )}

            <AdminModal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                title={selectedProduct ? 'Редактировать товар' : 'Добавить товар'}
                footer={
                    <>
                        <Button variant="outlined" onClick={closeEditModal}>
                            Отменить
                        </Button>
                        <Button
                            variant="outlined"
                            className="bg-black/5"
                            type="submit"
                            form="product-form"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Сохраняю...' : 'Сохранить'}
                        </Button>
                    </>
                }
                size="large"
            >
                <AdminBookForm
                    selectedProduct={selectedProduct}
                    collectionAuthors={collectionAuthors}
                    flags={{
                        isCollectionCategory,
                        isDownloadPackCategory,
                        isAuthorCollection,
                        selectedCollectionAuthorName,
                    }}
                    draftState={{
                        category: draftCategory,
                        fulfillment: draftFulfillment,
                        collectionAuthorId: draftCollectionAuthorId,
                        collectionKind: draftCollectionKind,
                        downloadPackCount: draftDownloadPackCount,
                    }}
                    draftHandlers={{
                        onCategoryChange: setDraftCategory,
                        onFulfillmentChange: setDraftFulfillment,
                        onCollectionAuthorChange: setDraftCollectionAuthorId,
                        onCollectionKindChange: setDraftCollectionKind,
                        onDownloadPackCountChange: setDraftDownloadPackCount,
                    }}
                    onSubmit={handleSave}
                />
            </AdminModal>

            <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Удаление из каталога"
                message={deleteMessage}
            />
        </AdminLayout>
    );
}
