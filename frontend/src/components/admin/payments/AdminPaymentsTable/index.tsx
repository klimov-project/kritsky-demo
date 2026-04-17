'use client';

import { useMemo } from 'react';

import AdminTable from '@/components/admin/AdminTable';
import Pagination from '@/components/shared/Pagination';
import type { AdminPayment } from '@/types/admin';
import type { AdminPaymentsTableColumn, AdminPaymentsTableProps } from '@/types/ui/adminPayments';
import { getAdminPaymentStatusClassName, getAdminPaymentStatusLabel } from '@/utils/adminPayments';

export default function AdminPaymentsTable({
    payments,
    page,
    totalPages,
    onPageChange,
}: AdminPaymentsTableProps) {
    const columns = useMemo<AdminPaymentsTableColumn[]>(
        () => [
            { header: 'ID Оплаты', accessor: 'id' },
            { header: 'Пользователь', accessor: 'userName' },
            {
                header: 'Сумма',
                accessor: (payment: AdminPayment) => `${payment.amount} ₽`,
                className: 'font-bold',
            },
            {
                header: 'Статус',
                accessor: (payment: AdminPayment) => (
                    <span className={`text-[12px] font-bold ${getAdminPaymentStatusClassName(payment.status)}`}>
                        {getAdminPaymentStatusLabel(payment.status)}
                    </span>
                ),
            },
            { header: 'Дата', accessor: 'date' },
            { header: 'Метод', accessor: 'method' },
        ],
        [],
    );

    return (
        <>
            <AdminTable columns={columns} data={payments} emptyMessage="Транзакций не найдено" />
            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
    );
}
