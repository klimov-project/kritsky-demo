'use client';

import Button from '@/components/shared/Button';
import type { ShopProductDetailsErrorProps } from '@/types/ui/shopProductDetails';

export default function ShopProductDetailsError({ message, onBackToShop }: ShopProductDetailsErrorProps) {
    return (
        <div className="w-full max-w-[955px] mx-auto px-4 md:px-0 pt-[90px] pb-20 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {message || 'Товар не найден'}
            </div>
            <Button variant="outlined" onClick={onBackToShop}>
                Вернуться в магазин
            </Button>
        </div>
    );
}
