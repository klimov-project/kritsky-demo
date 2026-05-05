export type AdminSubscriptionStatus = 'Active' | 'Expired' | 'None';
export type AdminPaymentStatus = 'Success' | 'Pending' | 'Failed';
export type AdminOrderStatus = 'New' | 'Paid' | 'Delivered' | 'Cancelled';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    phone: string;
    registrationDate: string;
    subscriptionStatus: AdminSubscriptionStatus;
    variantsGeneratedTotal: number;
    downloadsTotal: number;
    weeklyGenerated: number;
    weeklyDownloaded: number;
    isBlocked: boolean;
}

export interface AdminSavedVariant {
    id: number;
    date: string;
    excerptTitle: string;
    poemTitle: string;
}

export interface AdminUserOrderItem {
    id: number;
    title: string;
    category: string | null;
    quantity: number;
    unitPrice: number;
    collectionConfig: { authorId?: string; authorName?: string; variantsCount?: number; collectionKind?: string } | null;
    downloadPackConfig: { downloadsCount?: number } | null;
}

export interface AdminUserOrder {
    id: number;
    date: string;
    status: string;
    totalAmount: number;
    items: AdminUserOrderItem[];
}

export interface AdminUserExport {
    id: number;
    date: string;
    action: string;
    savedVariantId: number | null;
    excerptTitle: string;
    poemTitle: string;
}

export interface AdminUserDetail {
    id: number;
    name: string;
    email: string;
    phone: string;
    registrationDate: string;
    subscriptionStatus: AdminSubscriptionStatus;
    subscriptionExpireDate: string | null;
    variantsGeneratedTotal: number;
    downloadsTotal: number;
    paidDownloadCredits: number;
    isBlocked: boolean;
    savedVariants: AdminSavedVariant[];
    variantExports: AdminUserExport[];
    orders: AdminUserOrder[];
}

export interface AdminPayment {
    id: string;
    userId: number;
    userName: string;
    amount: number;
    status: AdminPaymentStatus;
    date: string;
    method: string;
}

export interface AdminOrder {
    id: string;
    userName: string;
    items: string;
    total: number;
    status: AdminOrderStatus;
    date: string;
}

export interface AdminDashboardStats {
    subscriptionsCount: number;
    usersCount: number;
    generatedVariantsCount: number;
    downloadedVariantsCount: number;
    totalEarned: number;
    ordersCount: number;
    paymentsCount: number;
}
