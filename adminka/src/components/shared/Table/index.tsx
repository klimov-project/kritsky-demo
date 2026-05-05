'use client';

import React from 'react';

interface TableColumn<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
}

interface TableProps<T> {
    columns: TableColumn<T>[];
    data: T[];
    emptyMessage?: string;
}

export default function Table<T extends { id: string | number }>({
    columns,
    data,
    emptyMessage = 'Нет данных',
}: TableProps<T>) {
    return (
        <div className="w-full overflow-x-auto bg-white rounded-2xl border border-[#221E20]/10">
            <table className="w-full min-w-[700px] border-collapse">
                <thead className="bg-[#FAF8F7]">
                    <tr>
                        {columns.map((column, index) => (
                            <th
                                key={`${column.header}-${index}`}
                                className={`px-5 py-3 text-left text-xs uppercase tracking-wider text-[#221E20]/50 font-bold ${column.className || ''}`}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-[#221E20]/6">
                    {data.length ? data.map((row) => (
                        <tr key={row.id} className="hover:bg-[#fafafa] transition-colors">
                            {columns.map((column, index) => (
                                <td key={`${column.header}-${index}`} className={`px-5 py-4 text-sm text-[#221E20] ${column.className || ''}`}>
                                    {typeof column.accessor === 'function'
                                        ? column.accessor(row)
                                        : (row[column.accessor] as React.ReactNode)}
                                </td>
                            ))}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={columns.length} className="px-5 py-8 text-center text-sm text-[#221E20]/45">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
