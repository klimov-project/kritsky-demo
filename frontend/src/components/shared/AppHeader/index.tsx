'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { IconType } from 'react-icons';
import { CgProfile } from 'react-icons/cg';
import { FaRegBookmark, FaTelegram } from 'react-icons/fa';
import {
    IoBagHandleOutline,
    IoCartOutline,
    IoHomeOutline,
    IoLogInOutline,
    IoLogOutOutline,
    IoMailOutline,
} from 'react-icons/io5';
import { TbBook, TbListDetails } from 'react-icons/tb';
import { RiCloseLine, RiMenu3Line, RiVkFill } from 'react-icons/ri';
import { FiKey } from 'react-icons/fi';
import { GrStorage } from 'react-icons/gr';
import { RiFilePaper2Line } from 'react-icons/ri';

import { useAuth } from '@/context/AuthContext';

import styles from './AppHeader.module.scss';

type AppHeaderMode = 'user' | 'admin';
type ModalType = 'login' | 'register' | 'feedback' | 'admin-login';

interface AppHeaderProps {
    mode?: AppHeaderMode;
    cartItemsCount?: number;
    useOuterContainer?: boolean;
}

interface HeaderLink {
    href: string;
    label: string;
}

interface MobileActionItem {
    label: string;
    icon: IconType;
    onClick: () => void;
}

const USER_DESKTOP_LINKS: HeaderLink[] = [
    { href: '/new_test', label: 'Конструктор' },
    { href: '/author-variant', label: 'Вариант недели' },
    { href: '/shop', label: 'Магазин' },
];

const USER_MOBILE_LINKS: HeaderLink[] = [
    { href: '/new_test', label: 'Конструктор' },
    { href: '/author-variant', label: 'Вариант недели' },
    { href: '/shop', label: 'Магазин' },
];

const ADMIN_DESKTOP_LINKS: HeaderLink[] = [
    { href: '/admin', label: 'Дашборд' },
    { href: '/admin/users', label: 'Пользователи' },
    { href: '/admin/payments', label: 'Оплаты' },
    { href: '/admin/materials', label: 'База заданий' },
    { href: '/admin/books', label: 'Товары' },
    { href: '/admin/orders', label: 'Заказы' },
];

const ADMIN_MOBILE_LINKS: HeaderLink[] = [
    { href: '/admin', label: 'Дашборд' },
    { href: '/admin/users', label: 'Пользователи' },
    { href: '/admin/payments', label: 'Оплаты' },
    { href: '/admin/materials', label: 'База заданий' },
    { href: '/admin/books', label: 'Товары' },
    { href: '/admin/orders', label: 'Заказы' },
];

export default function AppHeader({
    mode = 'user',
    cartItemsCount = 1,
    useOuterContainer = true,
}: AppHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isAuthUser = user?.role === 'user';
    const isAdminUser = user?.role === 'admin';

    const getModalHref = (modal: ModalType) => `${pathname}?modal=${modal}`;

    const navigateTo = (href: string) => {
        setIsMobileMenuOpen(false);
        router.push(href);
    };

    const openModal = (modal: ModalType) => {
        setIsMobileMenuOpen(false);
        router.push(getModalHref(modal));
    };

    const isActivePath = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const desktopLinks = mode === 'admin' ? ADMIN_DESKTOP_LINKS : USER_DESKTOP_LINKS;
    const mobileLinks = mode === 'admin' ? ADMIN_MOBILE_LINKS : USER_MOBILE_LINKS;

    const mobileActionItems = useMemo<MobileActionItem[]>(() => {
        if (mode === 'admin') {
            return [
                {
                    label: 'Перейти на сайт',
                    icon: IoHomeOutline,
                    onClick: () => navigateTo('/'),
                },
                {
                    label: 'Выйти из админки',
                    icon: IoLogOutOutline,
                    onClick: () => {
                        setIsMobileMenuOpen(false);
                        logout('/?modal=admin-login');
                    },
                },
                {
                    label: 'Обратная связь',
                    icon: IoMailOutline,
                    onClick: () => openModal('feedback'),
                },
            ];
        }

        if (isAuthUser) {
            return [
                {
                    label: 'Мой профиль',
                    icon: CgProfile,
                    onClick: () => navigateTo('/profile'),
                },
                {
                    label: 'Выйти из аккаунта',
                    icon: IoLogOutOutline,
                    onClick: () => {
                        setIsMobileMenuOpen(false);
                        logout('/?modal=login');
                    },
                },
                {
                    label: 'Обратная связь',
                    icon: IoMailOutline,
                    onClick: () => openModal('feedback'),
                },
            ];
        }

        return [
            {
                label: 'Зарегистрироваться',
                icon: FiKey,
                onClick: () => openModal('register'),
            },
            {
                label: 'Войти на сайт',
                icon: IoLogInOutline,
                onClick: () => openModal('login'),
            },
            {
                label: 'Обратная связь',
                icon: IoMailOutline,
                onClick: () => openModal('feedback'),
            },
        ];
    }, [isAuthUser, logout, mode, pathname, router]);

    const shellClassName = [
        styles.shell,
        useOuterContainer ? styles['shell--container'] : styles['shell--embedded'],
    ].join(' ').trim();

    return (
        <>
            <header className={styles.root}>
                <div className={shellClassName}>
                    <Link href={mode === 'admin' ? '/admin' : '/'} className={styles.logoLink} aria-label="Главная">
                        <Image src="/logo.svg" alt="ЕГЭ / КРИЦКИЙ" width={179} height={43} priority />
                    </Link>

                    <nav
                        className={[
                            styles.desktopNav,
                            mode === 'admin' ? styles['desktopNav--admin'] : '',
                        ].join(' ').trim()}
                    >
                        {desktopLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={[
                                    styles.desktopNavLink,
                                    isActivePath(link.href) ? styles['desktopNavLink--active'] : '',
                                ].join(' ').trim()}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {mode === 'admin' ? (
                        <div className={styles.desktopAdminActions}>
                            <Link
                                href="/new_test"
                                target="_blank"
                                className={styles.iconLink}
                                title="Тестовый сбор"
                                aria-label="Открыть тестовый сбор"
                            >
                                <RiFilePaper2Line size={22} />
                            </Link>

                            <a
                                href="http://79.174.80.129:9000"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.iconLink}
                                title="Minio S3"
                                aria-label="Открыть Minio S3"
                            >
                                <GrStorage size={20} />
                            </a>

                            <span className={styles.actionDivider} />

                            <button
                                type="button"
                                onClick={() => logout('/?modal=admin-login')}
                                className={styles.desktopLogout}
                                aria-label="Выйти из админки"
                            >
                                <span>Выход</span>
                                <IoLogOutOutline size={22} />
                            </button>
                        </div>
                    ) : (
                        <div className={styles.desktopUserActions}>
                            {isAuthUser ? (
                                <>
                                    <Link href="/my-variants" className={styles.iconLink} aria-label="Мои варианты">
                                        <TbListDetails size={24} />
                                    </Link>
                                    <span className={styles.actionDivider} />
                                    <Link href="/my-books" className={styles.iconLink} aria-label="Мои покупки">
                                        <TbBook size={24} />
                                    </Link>
                                    <span className={styles.actionDivider} />
                                    <Link href="/cart" className={styles.iconLink} aria-label="Корзина">
                                        <IoCartOutline size={24} />
                                    </Link>
                                    <span className={styles.actionDivider} />
                                    <Link href="/saved" className={styles.iconLink} aria-label="Избранное">
                                        <FaRegBookmark size={20} />
                                    </Link>
                                    <span className={styles.actionDivider} />
                                    <Link href="/profile" className={styles.iconLink} aria-label="Профиль">
                                        <CgProfile size={24} />
                                    </Link>
                                </>
                            ) : isAdminUser ? (
                                <Link href="/admin" className={styles.adminBadgeLink}>
                                    В админку
                                </Link>
                            ) : (
                                <Link href={getModalHref('login')} className={styles.iconLink} aria-label="Войти">
                                    <IoLogInOutline size={24} />
                                </Link>
                            )}
                        </div>
                    )}

                    <div className={styles.mobileActions}>
                        {mode === 'user' ? (
                            <>
                                <Link href="/cart" className={styles.iconLink} aria-label="Корзина">
                                    <span className={styles.cartWrap}>
                                        <IoBagHandleOutline size={24} />
                                        <span className={styles.cartBadge}>{cartItemsCount}</span>
                                    </span>
                                </Link>
                                {isAuthUser ? (
                                    <Link href="/profile" className={styles.iconLink} aria-label="Профиль">
                                        <CgProfile size={24} />
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        className={styles.iconButton}
                                        aria-label="Войти"
                                        onClick={() => openModal('login')}
                                    >
                                        <IoLogInOutline size={24} />
                                    </button>
                                )}
                            </>
                        ) : null}

                        <button
                            type="button"
                            className={styles.iconButton}
                            aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                            onClick={() => setIsMobileMenuOpen((prevState) => !prevState)}
                        >
                            <RiMenu3Line size={24} />
                        </button>
                    </div>
                </div>
            </header>

            {isMobileMenuOpen ? (
                <div className={styles.mobileOverlay}>
                    <div className={styles.mobileOverlayHeader}>
                        <Link href={mode === 'admin' ? '/admin' : '/'} className={styles.logoLink} aria-label="Главная">
                            <Image src="/logo.svg" alt="ЕГЭ / КРИЦКИЙ" width={179} height={43} priority />
                        </Link>

                        <button
                            type="button"
                            className={styles.iconButton}
                            aria-label="Закрыть меню"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <RiCloseLine size={27} />
                        </button>
                    </div>

                    <p className={styles.mobileMenuTitle}>МЕНЮ</p>

                    <nav className={styles.mobileNav}>
                        {mobileLinks.map((link) => (
                            <button
                                key={link.href}
                                type="button"
                                className={styles.mobileNavButton}
                                onClick={() => navigateTo(link.href)}
                            >
                                {link.label}
                            </button>
                        ))}
                    </nav>

                    <div className={styles.mobileBottom}>
                        <div className={styles.mobileActionList}>
                            {mobileActionItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        className={styles.mobileActionButton}
                                        onClick={item.onClick}
                                    >
                                        <Icon size={16} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.mobileSocials}>
                            <a href="#" className={styles.mobileSocialLink} aria-label="VK">
                                <RiVkFill size={18} />
                            </a>
                            <a href="#" className={styles.mobileSocialLink} aria-label="Telegram">
                                <FaTelegram size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
