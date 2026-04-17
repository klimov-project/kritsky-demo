'use client';

import { Suspense } from 'react';

import MyBooksPageContent from '@/components/my-books/list/MyBooksPageContent';

export default function MyBooksPage() {
    return (
        <Suspense fallback={null}>
            <MyBooksPageContent />
        </Suspense>
    );
}
