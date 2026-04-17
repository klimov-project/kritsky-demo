'use client';

import { useMemo } from 'react';

import AdminTable from '@/components/admin/AdminTable';
import Pagination from '@/components/shared/Pagination';
import type { AdminOrder } from '@/types/admin';
import type { AdminOrdersTableColumn, AdminOrdersTableProps } from '@/types/ui/adminOrders';
import {
    ADMIN_ORDER_ACTION_OPTIONS,
    getAdminOrderStatusClassName,
    getAdminOrderStatusLabel,
} from '@/utils/adminOrders';

export default function AdminOrdersTable({
    orders,
    page,
    totalPages,
    onPageChange,
}: AdminOrdersTableProps) {
    const columns = useMemo<AdminOrdersTableColumn[]>(
        () => [
            { header: 'ID Заказа', accessor: 'id' },
            { header: 'Пользователь', accessor: 'userName' },
            { header: 'Товары', accessor: 'items', className: 'max-w-xs truncate' },
            {
                header: 'Сумма',
                accessor: (order: AdminOrder) => `${order.total} ₽`,
                className: 'font-bold',
            },
            {
                header: 'Статус',
                accessor: (order: AdminOrder) => (
                    <span
                        className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-tight ${getAdminOrderStatusClassName(
                            order.status,
                        )}`}
                    >
                        {getAdminOrderStatusLabel(order.status)}
                    </span>
                ),
            },
            { header: 'Дата', accessor: 'date' },
            {
                header: 'Действие',
                accessor: () => (
                    <select className="text-[12px] bg-white border border-gray-200 rounded px-2 py-1 outline-none">
                        {ADMIN_ORDER_ACTION_OPTIONS.map((option) => (
                            <option key={option}>{option}</option>
                        ))}
                    </select>
                ),
            },
        ],
        [],
    );

    return (
        <>
            <AdminTable columns={columns} data={orders} emptyMessage="Заказы не найдены" />
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
    );
}
