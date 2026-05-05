import {
    adminActivateSubscription,
    adminDeactivateSubscription,
    adminSetDownloadCredits,
    getAdminUser,
    setAdminUserBlockStatus,
} from '@/lib/adminApi';
import type { AdminUserDetailLoadResult } from '@/types/api/adminUserDetail';

export const loadAdminUserDetail = async (userId: number): Promise<AdminUserDetailLoadResult> => {
    const user = await getAdminUser(userId);
    return { user };
};

export const updateAdminUserBlockStatus = async (userId: number, block: boolean): Promise<void> => {
    await setAdminUserBlockStatus(userId, block);
};

export const activateAdminUserSubscription = async (userId: number, days: number): Promise<void> => {
    await adminActivateSubscription(userId, days);
};

export const deactivateAdminUserSubscription = async (userId: number): Promise<void> => {
    await adminDeactivateSubscription(userId);
};

export const setAdminUserDownloadCredits = async (userId: number, credits: number): Promise<void> => {
    await adminSetDownloadCredits(userId, credits);
};
