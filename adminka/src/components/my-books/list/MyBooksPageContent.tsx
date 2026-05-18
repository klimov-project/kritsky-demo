'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiLogOut, FiMail, FiZap } from 'react-icons/fi';

import PageLayout from '@/components/layout/PageLayout';
import MyBookPurchaseCard from '@/components/my-books/list/MyBookPurchaseCard';
import { useAuth } from '@/context/AuthContext';
import { useProfileCabinetData } from '@/hooks/useProfileCabinetData';
import { useMyBooksPage } from '@/hooks/useMyBooksPage';
import styles from './MyBooksPageContent.module.scss';

const PROFILE_TABS = [
    { href: '/profile', label: 'Мой профиль' },
    { href: '/my-variants', label: 'Сохраненные варианты' },
    { href: '/my-books', label: 'Покупки' },
];

const buildPagination = (page: number, totalPages: number): number[] => {
    if (totalPages <= 3) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const bucket = new Set<number>([1, totalPages, page]);
    if (page > 1) bucket.add(page - 1);
    if (page < totalPages) bucket.add(page + 1);
    return [...bucket].sort((left, right) => left - right).slice(0, 3);
};

export default function MyBooksPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const { logout } = useAuth();
    const { subscriptionUntilLabel } = useProfileCabinetData();
    const {
        user,
        isAuthLoading,
        filteredPurchases,
        purchasesMeta,
        isLoadingPurchases,
        error,
        currentCategoryLabel,
        openPurchase,
        setPage,
    } = useMyBooksPage();

    if (isAuthLoading || !user || user.role !== 'user') {
        return null;
    }

    const pagination = buildPagination(purchasesMeta.page, purchasesMeta.totalPages);
    const openFeedbackModal = () => {
        router.push(`${pathname}?modal=feedback`, { scroll: false });
    };

    return (
        <PageLayout bodyClassName="index-page">
            <div className={styles.wrapper}>
                <h1 className={styles.title}>Личный кабинет</h1>

                <div className={styles.layout}>
                    <aside className={styles.sidebar}>
                        <section className={styles.subscriptionCard}>
                            <FiZap className={styles.subscriptionIcon} size={20} />
                            <div className={styles.subscriptionText}>
                                <span>Подписка действительная до:</span>
                                <strong>{subscriptionUntilLabel}</strong>
                            </div>
                        </section>

                        <button type="button" className={styles.feedbackButton} onClick={openFeedbackModal}>
                            <FiMail size={15} />
                            <span>Обратная связь</span>
                        </button>
                    </aside>

                    <section className={styles.mainCard}>
                        <div className={styles.profileTabs}>
                            <div className={styles.profileTabsLinks}>
                                {PROFILE_TABS.map((tab, index) => (
                                    <Link
                                        key={tab.href}
                                        href={tab.href}
                                        className={`${styles.profileTab} ${index === 2 ? styles.profileTabActive : ''}`}
                                    >
                                        {tab.label}
                                    </Link>
                                ))}
                            </div>

                            <button type="button" className={styles.logoutButton} onClick={() => logout('/?modal=login')}>
                                <span>Выйти</span>
                                <FiLogOut size={19} />
                            </button>
                        </div>

                        <div className={styles.mainContent}>
                            <p className={styles.description}>
                                {currentCategoryLabel ? `Покупки в разделе «${currentCategoryLabel}».` : 'Здесь хранятся оплаченные цифровые продукты'}
                            </p>

                            {isLoadingPurchases && <div className={styles.placeholder}>Загружаю покупки...</div>}
                            {!isLoadingPurchases && error && <div className={styles.error}>{error}</div>}
                            {!isLoadingPurchases && !error && filteredPurchases.length === 0 && (
                                <div className={styles.placeholder}>
                                    {currentCategoryLabel ? 'Покупок в этом разделе пока нет.' : 'У вас пока нет покупок.'}
                                </div>
                            )}

                            {!isLoadingPurchases && !error && filteredPurchases.length > 0 && (
                                <div className={styles.purchasesList}>
                                    {filteredPurchases.map((purchase) => (
                                        <MyBookPurchaseCard
                                            key={purchase.id}
                                            purchase={purchase}
                                            onOpenPurchase={openPurchase}
                                        />
                                    ))}
                                </div>
                            )}

                            {!isLoadingPurchases && !error && purchasesMeta.totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button type="button" className={styles.pageButton} onClick={() => setPage(purchasesMeta.page - 1)} disabled={purchasesMeta.page <= 1}>
                                        <FiChevronLeft size={16} />
                                    </button>
                                    {pagination.map((pageNumber) => (
                                        <button
                                            key={pageNumber}
                                            type="button"
                                            className={`${styles.pageButton} ${pageNumber === purchasesMeta.page ? styles.pageButtonActive : ''}`}
                                            onClick={() => setPage(pageNumber)}
                                        >
                                            {pageNumber}
                                        </button>
                                    ))}
                                    <button type="button" className={styles.pageButton} onClick={() => setPage(purchasesMeta.page + 1)} disabled={purchasesMeta.page >= purchasesMeta.totalPages}>
                                        <FiChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className={styles.mobileExtras}>
                    <section className={styles.subscriptionCard}>
                        <FiZap className={styles.subscriptionIcon} size={20} />
                        <div className={styles.subscriptionText}>
                            <span>Подписка действительная до:</span>
                            <strong>{subscriptionUntilLabel}</strong>
                        </div>
                    </section>

                    <button type="button" className={styles.feedbackButton} onClick={openFeedbackModal}>
                        <FiMail size={15} />
                        <span>Обратная связь</span>
                    </button>
                </div>
            </div>
        </PageLayout>
    );
}
