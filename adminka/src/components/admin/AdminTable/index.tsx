'use client';

import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface AdminTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}

export default function AdminTable<T extends { id: string | number }>({
    columns,
    data,
    onRowClick,
    emptyMessage = 'Данных не найдено'
}: AdminTableProps<T>) {
    return (
        <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-gray-50/50">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                className={`px-6 py-4 text-[13px] font-bold text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.length > 0 ? data.map((item) => (
                        <tr
                            key={item.id}
                            onClick={() => onRowClick && onRowClick(item)}
                            className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50/50' : ''} transition-colors`}
                        >
                            {columns.map((col, idx) => (
                                <td key={idx} className={`px-6 py-4 text-[14px] text-[#221E20] ${col.className || ''}`}>
                                    {typeof col.accessor === 'function'
                                        ? col.accessor(item)
                                        : (item[col.accessor] as React.ReactNode)}
                                </td>
                            ))}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-400 italic font-serif">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
