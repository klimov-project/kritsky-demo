import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import {
    activateAdminUserSubscription,
    deactivateAdminUserSubscription,
    loadAdminUserDetail,
    setAdminUserDownloadCredits,
    updateAdminUserBlockStatus,
} from '@/lib/api/adminUserDetail';
import type { AdminUserDetail } from '@/types/admin';
import {
    calculateDaysUntilDate,
    getAdminUserCollectionOrders,
    getAdminUserDetailErrorMessage,
    getAdminUserDownloadPackOrders,
    parseNonNegativeCredits,
} from '@/utils/adminUserDetail';

export const useAdminUserDetailPage = () => {
    const params = useParams<{ id: string }>();
    const userId = Number(params?.id);

    const [user, setUser] = useState<AdminUserDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [customDate, setCustomDate] = useState('');
    const [creditsInput, setCreditsInput] = useState('');

    const loadUser = useCallback(async () => {
        if (!userId || Number.isNaN(userId)) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await loadAdminUserDetail(userId);
            setUser(response.user);
            setCreditsInput(String(response.user.paidDownloadCredits || 0));
        } catch (errorValue) {
            setError(getAdminUserDetailErrorMessage(errorValue, 'Ошибка загрузки пользователя'));
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        void loadUser();
    }, [loadUser]);

    const handleBlockToggle = async () => {
        if (!user) return;
        if (!confirm(`Вы уверены, что хотите ${user.isBlocked ? 'разблокировать' : 'заблокировать'} пользователя?`)) {
            return;
        }

        setActionLoading(true);
        try {
            await updateAdminUserBlockStatus(user.id, !user.isBlocked);
            await loadUser();
        } catch (errorValue) {
            alert(getAdminUserDetailErrorMessage(errorValue, 'Ошибка изменения статуса блокировки'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleGiveSubscription = async (days: number) => {
        if (!user) return;
        if (!confirm(`Выдать подписку на ${days} дней?`)) return;

        setActionLoading(true);
        try {
            await activateAdminUserSubscription(user.id, days);
            await loadUser();
        } catch (errorValue) {
            alert(getAdminUserDetailErrorMessage(errorValue, 'Ошибка выдачи подписки'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleGiveSubscriptionUntilDate = async () => {
        if (!user || !customDate) return;

        const diffDays = calculateDaysUntilDate(customDate);
        if (diffDays <= 0) {
            alert('Дата должна быть в будущем');
            return;
        }

        if (!confirm(`Выдать подписку до ${customDate} (${diffDays} дней)?`)) return;

        setActionLoading(true);
        try {
            await activateAdminUserSubscription(user.id, diffDays);
            await loadUser();
            setCustomDate('');
        } catch (errorValue) {
            alert(getAdminUserDetailErrorMessage(errorValue, 'Ошибка выдачи подписки'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveSubscription = async () => {
        if (!user) return;
        if (!confirm('Вы уверены, что хотите деактивировать подписку?')) return;

        setActionLoading(true);
        try {
            await deactivateAdminUserSubscription(user.id);
            await loadUser();
        } catch (errorValue) {
            alert(getAdminUserDetailErrorMessage(errorValue, 'Ошибка удаления подписки'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleSetDownloadCredits = async () => {
        if (!user) return;

        const credits = parseNonNegativeCredits(creditsInput);
        if (credits == null) {
            alert('Введите корректное число (0 или больше)');
            return;
        }

        setActionLoading(true);
        try {
            await setAdminUserDownloadCredits(user.id, credits);
            await loadUser();
        } catch (errorValue) {
            alert(getAdminUserDetailErrorMessage(errorValue, 'Ошибка изменения кредитов'));
        } finally {
            setActionLoading(false);
        }
    };

    const collectionsOrders = useMemo(() => getAdminUserCollectionOrders(user), [user]);
    const downloadPackOrders = useMemo(() => getAdminUserDownloadPackOrders(user), [user]);

    return {
        user,
        isLoading,
        error,
        actionLoading,
        customDate,
        creditsInput,
        collectionsOrders,
        downloadPackOrders,
        setCustomDate,
        setCreditsInput,
        handleBlockToggle,
        handleGiveSubscription,
        handleGiveSubscriptionUntilDate,
        handleRemoveSubscription,
        handleSetDownloadCredits,
    };
};
