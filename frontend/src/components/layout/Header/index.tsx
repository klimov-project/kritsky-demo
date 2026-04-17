'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { IoCartOutline, IoLogInOutline } from 'react-icons/io5';
import { FaRegBookmark } from "react-icons/fa";
import { TbBook, TbListDetails } from 'react-icons/tb';
import { CgProfile } from 'react-icons/cg';
import { RiCloseLine, RiMenu3Line } from 'react-icons/ri';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
    const { user } = useAuth();
    const isAuthUser = user?.role === 'user';
    const isAdmin = user?.role === 'admin';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    return (
        <header className="w-full h-[70px] sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F0F0F0] overflow-visible">
            <div className="relative h-full flex items-center justify-between px-4 md:px-8 max-w-[1440px] mx-auto text-[#221E20] font-serif">
                <div className="flex items-center">
                    <Link href="/" className="hover:opacity-80 transition-opacity flex items-center h-[50px]">
                        <Image src="/logo.png" alt="КРИЦКИЙ" width={180} height={50} className="object-contain max-h-full" />
                    </Link>

                    <nav className="hidden lg:flex items-center ml-[60px] gap-[40px] text-[16px]">
                        <Link href="/new_test" className="nav-link-animated">Конструктор</Link>
                        <Link href="/author-variant" className="nav-link-animated">Вариант недели</Link>
                        <Link href="/shop" className="nav-link-animated">Магазин</Link>
                    </nav>
                </div>

                <div className="flex items-center">
                    {isAuthUser ? (
                        <div className="hidden lg:flex items-center">
                            <Link href="/my-variants" className="hover:opacity-70 transition-opacity" aria-label="Мои варианты">
                                <TbListDetails size={24} />
                            </Link>
                            <div className="w-px h-[45px] bg-[#D4D4D6] mx-[13px]" />
                            <Link href="/my-books" className="hover:opacity-70 transition-opacity" aria-label="Мои покупки">
                                <TbBook size={24} />
                            </Link>
                            <div className="w-px h-[45px] bg-[#D4D4D6] mx-[13px]" />
                            <Link href="/cart" className="hover:opacity-70 transition-opacity" aria-label="Корзина">
                                <IoCartOutline size={24} />
                            </Link>
                            <div className="w-px h-[45px] bg-[#D4D4D6] mx-[13px]" />
                            <Link href="/saved" className="hover:opacity-70 transition-opacity" aria-label="Избранное">
                                <FaRegBookmark size={20} />
                            </Link>
                            <div className="w-px h-[45px] bg-[#D4D4D6] mx-[13px]" />
                            <Link href="/profile" className="hover:opacity-70 transition-opacity" aria-label="Профиль">
                                <CgProfile size={24} />
                            </Link>
                        </div>
                    ) : isAdmin ? (
                        <Link href="/admin" className="hidden lg:flex items-center gap-2 hover:opacity-70 transition-opacity">
                            В админку
                        </Link>
                    ) : (
                        <Link href="/login" className="hidden lg:flex items-center gap-2 hover:opacity-70 transition-opacity">
                            <IoLogInOutline size={24} />
                        </Link>
                    )}

                    <button
                        className="lg:hidden ml-4 p-1 text-[30px] leading-none"
                        aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                    >
                        {isMobileMenuOpen ? <RiCloseLine /> : <RiMenu3Line />}
                    </button>
                </div>

                {isMobileMenuOpen && (
                    <div className="lg:hidden absolute top-[70px] left-0 right-0 h-[calc(100dvh-70px)] bg-white border-t border-[#F0F0F0] px-6 py-7">
                        <div className="h-full flex flex-col justify-between gap-6 overflow-y-auto">
                            <nav className="flex flex-col gap-6 text-xl">
                                <Link href="/new_test" className="hover:opacity-70 transition-opacity" onClick={closeMobileMenu}>Конструктор</Link>
                                <Link href="/author-variant" className="hover:opacity-70 transition-opacity" onClick={closeMobileMenu}>Вариант недели</Link>
                                <Link href="/shop" className="hover:opacity-70 transition-opacity" onClick={closeMobileMenu}>Магазин</Link>
                                {isAuthUser ? (
                                    <>
                                        <Link href="/my-variants" className="hover:opacity-70 transition-opacity" onClick={closeMobileMenu}>Мои варианты</Link>
                                        <Link href="/my-books" className="hover:opacity-70 transition-opacity" onClick={closeMobileMenu}>Мои покупки</Link>
                                        <Link href="/cart" className="hover:opacity-70 transition-opacity" onClick={closeMobileMenu}>Корзина</Link>
                                        <Link href="/saved" className="hover:opacity-70 transition-opacity" onClick={closeMobileMenu}>Избранное</Link>
                                        <Link href="/profile" className="hover:opacity-70 transition-opacity" onClick={closeMobileMenu}>Профиль</Link>
                                    </>
                                ) : isAdmin ? (
                                    <Link href="/admin" className="hover:opacity-70 transition-opacity" onClick={closeMobileMenu}>В админку</Link>
                                ) : (
                                    <Link href="/login" className="hover:opacity-70 transition-opacity" onClick={closeMobileMenu}>Войти</Link>
                                )}
                            </nav>

                            <div className="flex items-center gap-2 pt-2">
                                <Link
                                    href="/feedback"
                                    onClick={closeMobileMenu}
                                    className="text-xs px-3 py-2 border border-[#221E20]/30 rounded-full hover:border-[#221E20] transition-colors"
                                >
                                    Обратная связь
                                </Link>
                                <Link
                                    href="/privacy"
                                    onClick={closeMobileMenu}
                                    className="text-xs px-3 py-2 border border-[#221E20]/30 rounded-full hover:border-[#221E20] transition-colors"
                                >
                                    Политика
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
