import type { AdminUserDetail, AdminUserOrder } from '@/types/admin';

export interface AdminUserDetailContentProps {
    user: AdminUserDetail;
    actionLoading: boolean;
    customDate: string;
    creditsInput: string;
    collectionsOrders: AdminUserOrder[];
    downloadPackOrders: AdminUserOrder[];
    onCustomDateChange: (value: string) => void;
    onCreditsInputChange: (value: string) => void;
    onBlockToggle: () => void;
    onGiveSubscription: (days: number) => void;
    onGiveSubscriptionUntilDate: () => void;
    onRemoveSubscription: () => void;
    onSetDownloadCredits: () => void;
}
