'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { type ReactNode } from 'react';
import { IoFlashOutline, IoLogOutOutline, IoMailOutline } from 'react-icons/io5';

import type { CabinetSection } from './types';
import styles from './ProfileCabinetShell.module.scss';

interface ProfileCabinetShellProps {
    activeSection: CabinetSection;
    subscriptionUntilLabel: string;
    onLogout: () => void;
    showMobileSideCards?: boolean;
    children: ReactNode;
}

const sectionTabs: Array<{ key: CabinetSection; label: string; href: string }> = [
    { key: 'subscription', label: 'Подписка', href: '/profile/tariff' },
    { key: 'personal', label: 'Личные данные', href: '/profile' },
    { key: 'payments', label: 'История оплаты', href: '/profile/tariff-history' },
];

const profileTabs = [
    { label: 'Мой профиль', href: '/profile' },
    { label: 'Сохраненные варианты', href: '/my-variants' },
    { label: 'Покупки', href: '/my-books' },
];

export default function ProfileCabinetShell({
    activeSection,
    subscriptionUntilLabel,
    onLogout,
    showMobileSideCards = true,
    children,
}: ProfileCabinetShellProps) {
    const router = useRouter();
    const pathname = usePathname();

    const openFeedbackModal = () => {
        router.push(`${pathname}?modal=feedback`);
    };

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Личный кабинет</h1>

            <nav className={styles.mobileSectionTabs} aria-label="Разделы кабинета">
                {sectionTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={[
                            styles.mobileSectionButton,
                            activeSection === tab.key ? styles['mobileSectionButton--active'] : '',
                        ].join(' ').trim()}
                        onClick={() => router.push(tab.href)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <nav className={styles.sectionCard} aria-label="Навигация кабинета">
                        {sectionTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={[
                                    styles.sectionButton,
                                    activeSection === tab.key ? styles['sectionButton--active'] : '',
                                ].join(' ').trim()}
                                onClick={() => router.push(tab.href)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <section className={styles.subscriptionCard} aria-label="Информация о подписке">
                        <IoFlashOutline className={styles.subscriptionIcon} size={22} />
                        <div>
                            <p className={styles.subscriptionLabel}>Подписка действительная до:</p>
                            <p className={styles.subscriptionDate}>{subscriptionUntilLabel}</p>
                        </div>
                    </section>

                    <button type="button" className={styles.feedbackButton} onClick={openFeedbackModal}>
                        <IoMailOutline size={16} />
                        <span>Обратная связь</span>
                    </button>
                </aside>

                <section className={styles.mainCard}>
                    <div className={styles.profileTabs}>
                        <div className={styles.profileTabsLinks}>
                            {profileTabs.map((tab, index) => (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={[
                                        styles.profileTab,
                                        index === 0 ? styles['profileTab--active'] : '',
                                    ].join(' ').trim()}
                                >
                                    {tab.label}
                                </Link>
                            ))}
                        </div>

                        <button type="button" className={styles.logoutButton} onClick={onLogout}>
                            <span>Выйти</span>
                            <IoLogOutOutline size={21} />
                        </button>
                    </div>

                    <div className={styles.mainContent}>{children}</div>
                </section>
            </div>

            {showMobileSideCards ? (
                <div className={styles.mobileExtras}>
                    <section className={styles.mobileSubscriptionCard}>
                        <IoFlashOutline className={styles.subscriptionIcon} size={21} />
                        <p className={styles.mobileSubscriptionText}>
                            Подписка действительная до: <span>{subscriptionUntilLabel}</span>
                        </p>
                    </section>

                    <button type="button" className={styles.feedbackButton} onClick={openFeedbackModal}>
                        <IoMailOutline size={16} />
                        <span>Обратная связь</span>
                    </button>
                </div>
            ) : null}
        </div>
    );
}

