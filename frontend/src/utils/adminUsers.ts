import type { AdminSubscriptionStatus, AdminUser } from '@/types/admin';
import type { AdminUsersStatusFilter } from '@/types/ui/adminUsers';

interface AdminUsersFilterParams {
    search: string;
    statusFilter: AdminUsersStatusFilter;
    generatedMin: string;
}

export const filterAdminUsers = (
    users: AdminUser[],
    { search, statusFilter, generatedMin }: AdminUsersFilterParams,
): AdminUser[] => {
    const minValue = Number(generatedMin);
    const hasMinFilter = generatedMin.trim() !== '' && Number.isFinite(minValue);

    return users.filter((user) => {
        const matchesSearch = [user.name, user.email, user.phone].join(' ').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || user.subscriptionStatus === statusFilter;
        const matchesGenerated = !hasMinFilter || user.variantsGeneratedTotal >= minValue;
        return matchesSearch && matchesStatus && matchesGenerated;
    });
};

export const paginateItems = <T,>(items: T[], page: number, pageSize: number) => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageData = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return {
        totalPages,
        currentPage,
        pageData,
    };
};

export const getSubscriptionLabel = (status: AdminSubscriptionStatus): string => {
    if (status === 'Active') return 'Активна';
    if (status === 'Expired') return 'Истекла';
    return 'Нет';
};

export const getSubscriptionBadgeClassName = (status: AdminSubscriptionStatus): string => {
    if (status === 'Active') return 'bg-green-100 text-green-700';
    if (status === 'Expired') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
};
