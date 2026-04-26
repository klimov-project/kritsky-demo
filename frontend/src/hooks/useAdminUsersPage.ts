import { useEffect, useMemo, useState } from 'react';

import { loadAdminUsers } from '@/lib/api/adminUsers';
import type { AdminUser } from '@/types/admin';
import type { AdminUsersStatusFilter } from '@/types/ui/adminUsers';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 75, 100];
const DEFAULT_PAGE_SIZE = 25;

export const useAdminUsersPage = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState<AdminUsersStatusFilter>('All');
    const [generatedMin, setGeneratedMin] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await loadAdminUsers(page, pageSize, search);
                if (!cancelled) {
                    setUsers(response.items);
                    setTotalPages(response.totalPages);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить пользователей');
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
    }, [page, pageSize, search]);

    const pageData = users;
    const currentPage = page;

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleToggleFilters = () => {
        setShowFilters((prev) => !prev);
    };

    const handleStatusFilterChange = (value: AdminUsersStatusFilter) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleGeneratedMinChange = (value: string) => {
        setGeneratedMin(value);
        setPage(1);
    };

    const handleResetFilters = () => {
        setStatusFilter('All');
        setGeneratedMin('');
        setPage(1);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setPage(1);
    };

    return {
        search,
        showFilters,
        statusFilter,
        generatedMin,
        isLoading,
        error,
        pageSize,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        pageData,
        currentPage,
        totalPages,
        handleSearchChange,
        handleToggleFilters,
        handleStatusFilterChange,
        handleGeneratedMinChange,
        handleResetFilters,
        handlePageChange: setPage,
        handlePageSizeChange,
    };
};
