'use client';

import { Suspense } from 'react';
import MyVariantsLibraryPage from '@/components/my-variants/library/MyVariantsLibraryPage';

export default function MyVariantsPage() {
    return (
        <Suspense fallback={null}>
            <MyVariantsLibraryPage />
        </Suspense>
    );
}
