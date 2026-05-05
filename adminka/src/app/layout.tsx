import type { Metadata } from "next";
import { Suspense } from 'react';
import "./globals.css";
import CopyProtection from "@/components/shared/CopyProtection";
import GlobalModals from "@/components/layout/GlobalModals";

export const metadata: Metadata = {
    title: 'Крицкий - подготовка к ЕГЭ',
    description: 'Крицкий - собери свой вариант для подготовки к ЕГЭ',
    icons: {
        icon: '/favicon.ico',
    },
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru">
            <body className="text-[#221E20] antialiased">
                <AuthProvider>
                    <CopyProtection />
                    {children}
                    <Suspense fallback={null}>
                        <GlobalModals />
                    </Suspense>
                </AuthProvider>
            </body>
        </html>
    );
}
