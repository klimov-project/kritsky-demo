'use client';

import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';
import { IoLogOutOutline } from 'react-icons/io5';
import { RiFilePaper2Line } from 'react-icons/ri';
import { GrStorage } from 'react-icons/gr';
import { useAuth } from '@/context/AuthContext';

export default function AdminHeader() {
    const pathname = usePathname();
    const { logout } = useAuth();

    const navLinks = [
        { href: '/admin', label: 'Дашборд' },
        { href: '/admin/users', label: 'Пользователи' },
        { href: '/admin/payments', label: 'Оплаты' },
        { href: '/admin/materials', label: 'База заданий' },
        { href: '/admin/books', label: 'Товары' },
        { href: '/admin/orders', label: 'Заказы' },
    ];

    const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

    const handleLogout = () => {
        logout('/admin/login');
    };

    return (
        <header className="w-full h-[70px] sticky top-0 z-50 bg-white border-b border-[#F0F0F0] font-serif">
            <div className="h-full flex items-center justify-between px-4 md:px-8 xl:px-[48px] max-w-[1440px] mx-auto text-[#221E20]">
                <div className="flex items-center">
                    <Link href="/admin" className="font-bold text-xl tracking-tight mr-8 hover:opacity-80 transition-opacity">
                        АДМИН / КРИЦКИЙ
                    </Link>

                    <nav className="hidden lg:flex items-center gap-[24px] text-[15px]">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link-animated ${isActive(link.href) ? 'font-bold' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    <Link href="/new_test" target="_blank" className="hover:opacity-70 transition-opacity flex items-center gap-1" title="Тестовый сбор">
                        <RiFilePaper2Line size={22} />
                        <span className="hidden xl:inline text-xs opacity-60">Тест</span>
                    </Link>

                    <a href="http://79.174.80.129:9000" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity flex items-center gap-1" title="Minio S3">
                        <GrStorage size={20} />
                        <span className="hidden xl:inline text-xs opacity-60">S3</span>
                    </a>

                    <div className="w-[1px] h-[30px] bg-[#D4D4D6] mx-1 md:mx-2" />

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 hover:opacity-70 transition-opacity text-[#cc0000]"
                        aria-label="Выход"
                    >
                        <span className="hidden lg:inline text-sm">Выход</span>
                        <IoLogOutOutline size={22} />
                    </button>
                </div>
            </div>
        </header>
    );
}
