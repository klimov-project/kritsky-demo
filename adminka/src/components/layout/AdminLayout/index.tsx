'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import AdminHeader from '../AdminHeader';
import ScrollToTopButton from '../ScrollToTopButton';
import { useAuth } from '@/context/AuthContext';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;
        if (!user || user.role !== 'admin') {
            router.replace('/?modal=admin-login');
        }
    }, [isLoading, router, user]);

    if (isLoading) return null;
    if (!user || user.role !== 'admin') return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-serif">
            <AdminHeader />
            <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 xl:px-12 py-10 overflow-x-hidden">
                {children}
            </main>
            <ScrollToTopButton />
        </div>
    );
}
