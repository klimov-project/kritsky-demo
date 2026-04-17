import type { Metadata } from "next";
import "./globals.css";
import CopyProtection from "@/components/shared/CopyProtection";

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
            <body className="font-serif text-[#221E20] antialiased">
                <AuthProvider>
                    <CopyProtection />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
