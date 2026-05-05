'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import AdminTable from '@/components/admin/AdminTable';
import Pagination from '@/components/shared/Pagination';
import type { AdminUser } from '@/types/admin';
import type { AdminUsersTableColumn, AdminUsersTableProps } from '@/types/ui/adminUsers';
import { getSubscriptionBadgeClassName, getSubscriptionLabel } from '@/utils/adminUsers';

export default function AdminUsersTable({
    users,
    page,
    totalPages,
    pageSize,
    pageSizeOptions,
    onPageChange,
    onPageSizeChange,
}: AdminUsersTableProps) {
    const columns = useMemo<AdminUsersTableColumn[]>(
        () => [
            { header: 'ID', accessor: 'id', className: 'w-16' },
            {
                header: 'Имя',
                accessor: (user: AdminUser) => (
                    <div className="flex items-center gap-2">
                        <Link href={`/admin/users/${user.id}`} className="font-bold hover:underline text-blue-600">
                            {user.name}
                        </Link>
                        {user.isBlocked && (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">
                                Блок
                            </span>
                        )}
                    </div>
                ),
            },
            {
                header: 'Email / Телефон',
                accessor: (user: AdminUser) => (
                    <div className="flex flex-col text-[13px]">
                        <span className="font-bold">{user.email || '—'}</span>
                        <span className="opacity-60">{user.phone || '—'}</span>
                    </div>
                ),
            },
            {
                header: 'Подписка',
                accessor: (user: AdminUser) => (
                    <span
                        className={`px-3 py-1 rounded-full text-[12px] font-bold ${getSubscriptionBadgeClassName(
                            user.subscriptionStatus,
                        )}`}
                    >
                        {getSubscriptionLabel(user.subscriptionStatus)}
                    </span>
                ),
            },
            {
                header: 'Активность (7 дней)',
                accessor: (user: AdminUser) => (
                    <div className="text-[13px]">
                        <div>
                            Сгенерировал: <span className="font-bold">{user.weeklyGenerated}</span>
                        </div>
                        <div>
                            Скачал: <span className="font-bold">{user.weeklyDownloaded}</span>
                        </div>
                    </div>
                ),
            },
            {
                header: 'Итого',
                accessor: (user: AdminUser) => (
                    <div className="text-[13px]">
                        <div>
                            Всего сгенерировано: <span className="font-bold">{user.variantsGeneratedTotal}</span>
                        </div>
                        <div>
                            Всего скачано: <span className="font-bold">{user.downloadsTotal}</span>
                        </div>
                    </div>
                ),
            },
        ],
        [],
    );

    return (
        <>
            <AdminTable columns={columns} data={users} emptyMessage="Пользователи не найдены" />
            <div className="flex items-center justify-between mt-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <span className="opacity-60">Показывать по:</span>
                    <select
                        value={pageSize}
                        onChange={(event) => onPageSizeChange(Number(event.target.value))}
                        className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none font-serif"
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
        </>
    );
}
