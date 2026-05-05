'use client';

import { useMemo } from 'react';
import { IoPencilOutline, IoTrashOutline } from 'react-icons/io5';

import AdminTable from '@/components/admin/AdminTable';
import Button from '@/components/shared/Button';
import Pagination from '@/components/shared/Pagination';
import { CATEGORY_LABELS, FULFILLMENT_LABELS } from '@/mocks/shop';
import type { AdminBooksProductsTableProps, AdminBooksTableColumn } from '@/types/ui/adminBooks';

export default function AdminBooksProductsTable({
    data,
    currentPage,
    totalPages,
    onPageChange,
    onEdit,
    onDelete,
}: AdminBooksProductsTableProps) {
    const columns = useMemo<AdminBooksTableColumn[]>(() => {
        return [
            {
                header: 'Обложка',
                accessor: (product) => (
                    <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-400 overflow-hidden">
                        {product.coverUrl ? (
                            <img src={product.coverUrl} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                            'IMG'
                        )}
                    </div>
                ),
                className: 'w-20',
            },
            { header: 'Название', accessor: 'title' },
            { header: 'Автор/Бренд', accessor: 'author' },
            {
                header: 'Цена',
                accessor: (product) => `${product.price} ₽`,
                className: 'font-bold',
            },
            {
                header: 'Категория',
                accessor: (product) => CATEGORY_LABELS[product.category] || product.category,
            },
            {
                header: 'Тип',
                accessor: (product) => FULFILLMENT_LABELS[product.fulfillment],
            },
            {
                header: 'Статистика',
                accessor: (product) => product.stats || '—',
                className: 'text-sm opacity-60',
            },
            {
                header: 'Действия',
                accessor: (product) => (
                    <div className="flex gap-2">
                        <Button
                            variant="outlined"
                            className="px-3 h-8 text-xs flex items-center gap-1.5 border-gray-200 text-blue-600 hover:bg-blue-50"
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(product);
                            }}
                        >
                            <IoPencilOutline size={14} /> Изменить
                        </Button>
                        <Button
                            variant="outlined"
                            className="px-3 h-8 text-xs flex items-center gap-1.5 border-gray-200 text-red-500 hover:bg-red-50"
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(product);
                            }}
                        >
                            <IoTrashOutline size={14} /> Удалить
                        </Button>
                    </div>
                ),
            },
        ];
    }, [onDelete, onEdit]);

    return (
        <>
            <AdminTable columns={columns} data={data} onRowClick={onEdit} />
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </>
    );
}
