'use client';

import Button from '@/components/shared/Button';
import type { MyBookPurchaseCardProps } from '@/types/ui/myBooks';
import {
    formatMyBooksDate,
    MY_BOOKS_CATEGORY_LABELS,
    MY_BOOKS_FULFILLMENT_LABELS,
} from '@/utils/myBooks';

export default function MyBookPurchaseCard({ purchase, onOpenPurchase }: MyBookPurchaseCardProps) {
    return (
        <div className="bg-white border border-[#221E20]/10 rounded-xl p-5 flex flex-col gap-4">
            <div className="h-[200px] bg-gray-100 rounded overflow-hidden flex items-center justify-center text-xs opacity-40 uppercase tracking-widest">
                {purchase.coverUrl ? (
                    <img src={purchase.coverUrl} alt={purchase.title} className="w-full h-full object-cover" />
                ) : (
                    'Обложка'
                )}
            </div>

            <h4 className="font-serif font-bold text-md leading-tight">{purchase.title}</h4>

            <div className="text-sm opacity-70">
                <div>Категория: {MY_BOOKS_CATEGORY_LABELS[purchase.category] || purchase.category}</div>
                <div>Дата покупки: {formatMyBooksDate(purchase.purchasedAt)}</div>
                <div>Тип: {MY_BOOKS_FULFILLMENT_LABELS[purchase.fulfillment] || purchase.fulfillment}</div>
                <div>Количество: {purchase.quantity}</div>
                <div className="font-bold mt-1">{purchase.total} ₽</div>
            </div>

            <Button
                variant="outlined"
                className="text-xs py-2 mt-auto"
                onClick={() => onOpenPurchase(purchase.id)}
            >
                Открыть товар
            </Button>
        </div>
    );
}
