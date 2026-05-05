import type { VariantExportQuota } from '@/lib/variantsApi';
import type { PaymentHistoryItem } from '@/types/shop';

export const EMPTY_QUOTA: VariantExportQuota = {
    hasActiveSubscription: false,
    dailyFreeLimit: 0,
    dailyFreeUsed: 0,
    dailyFreeRemaining: 0,
    paidDownloadsRemaining: 0,
};

const formatDate = (value: Date, year: '2-digit' | 'numeric') => {
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year,
    }).format(value);
};

export const formatDateFromIso = (value: string, year: '2-digit' | 'numeric' = 'numeric') => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return formatDate(date, year);
};

export const getNextMonthIso = (value: string): string | null => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate.toISOString();
};

export const getSubscriptionRangeLabel = (startValue: string): string => {
    const startLabel = formatDateFromIso(startValue, 'numeric');
    const endValue = getNextMonthIso(startValue);
    const endLabel = endValue ? formatDateFromIso(endValue, 'numeric') : '—';
    return `${startLabel} - ${endLabel}`;
};

export const getSubscriptionUntilLabel = (
    payments: PaymentHistoryItem[],
    hasActiveSubscription: boolean,
): string => {
    if (!hasActiveSubscription) {
        return '—';
    }

    const latestPayment = [...payments]
        .filter((payment) => payment.kind === 'subscription')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!latestPayment) {
        return '—';
    }

    const nextMonthIso = getNextMonthIso(latestPayment.createdAt);
    if (!nextMonthIso) {
        return '—';
    }
    return formatDateFromIso(nextMonthIso, '2-digit');
};

