'use client';

import { Suspense } from 'react';

import ShopCatalogContent from '@/components/shop/catalog/ShopCatalogContent';

export default function ShopPage() {
    return (
        <Suspense fallback={null}>
            <ShopCatalogContent />
        </Suspense>
    );
}
