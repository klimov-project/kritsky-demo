'use client';

import { IoFilterOutline } from 'react-icons/io5';

import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';
import type { AdminUsersStatusFilter, AdminUsersFiltersProps } from '@/types/ui/adminUsers';

export default function AdminUsersFilters({
    search,
    showFilters,
    statusFilter,
    generatedMin,
    onSearchChange,
    onToggleFilters,
    onStatusFilterChange,
    onGeneratedMinChange,
    onResetFilters,
}: AdminUsersFiltersProps) {
    return (
        <div className="mb-8 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-full max-w-[350px]">
                        <Input
                            placeholder="Поиск по имени, email или телефону"
                            value={search}
                            onChange={(event) => onSearchChange(event.target.value)}
                            className="!h-[48px] !rounded-[16px] border-[#221E20] text-sm"
                            width="full"
                        />
                    </div>
                    <Button variant="outlined" className="h-[48px] flex items-center gap-2" onClick={onToggleFilters}>
                        <IoFilterOutline /> Фильтр
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-wrap gap-8">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold opacity-40 uppercase">Статус подписки</label>
                        <select
                            value={statusFilter}
                            onChange={(event) => onStatusFilterChange(event.target.value as AdminUsersStatusFilter)}
                            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm outline-none font-serif min-w-[150px]"
                        >
                            <option value="All">Все</option>
                            <option value="Active">Активна</option>
                            <option value="Expired">Истекла</option>
                            <option value="None">Нет</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold opacity-40 uppercase">Мин. сгенерировано</label>
                        <input
                            type="number"
                            value={generatedMin}
                            onChange={(event) => onGeneratedMinChange(event.target.value)}
                            placeholder="0"
                            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm outline-none font-serif w-[160px]"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            className="text-xs font-bold text-red-500 hover:underline"
                            onClick={onResetFilters}
                        >
                            Сбросить фильтры
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
