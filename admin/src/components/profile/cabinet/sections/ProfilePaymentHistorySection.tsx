'use client';

import React, { useMemo, useState } from 'react';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';

import styles from './ProfilePaymentHistorySection.module.scss';

interface PaymentHistoryRow {
    id: string;
    dateLabel: string;
    periodLabel: string;
}

interface ProfilePaymentHistorySectionProps {
    rows: PaymentHistoryRow[];
    isLoading: boolean;
    loadingError: string;
}

const ITEMS_PER_PAGE = 8;

export default function ProfilePaymentHistorySection({
    rows,
    isLoading,
    loadingError,
}: ProfilePaymentHistorySectionProps) {
    const [activePage, setActivePage] = useState(1);

    const pagesCount = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));

    const pagedRows = useMemo(() => {
        const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
        return rows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [activePage, rows]);

    const pageNumbers = useMemo(() => {
        return Array.from({ length: pagesCount }, (_, index) => index + 1).slice(0, 5);
    }, [pagesCount]);

    return (
        <div className={styles.section}>
            <p className={styles.description}>Здесь собрана история вашей оплаты</p>

            <div className={styles.tableHeader}>
                <span>Дата</span>
                <span>Срок подписки</span>
            </div>

            {isLoading ? <p className={styles.statusText}>Загружаю историю...</p> : null}
            {!isLoading && loadingError ? <p className={styles.errorText}>{loadingError}</p> : null}
            {!isLoading && !loadingError && rows.length === 0 ? (
                <p className={styles.statusText}>Оплат подписки пока нет.</p>
            ) : null}

            {!isLoading && !loadingError ? (
                <div className={styles.rows}>
                    {pagedRows.map((row) => (
                        <article key={row.id} className={styles.row}>
                            <p>{row.dateLabel}</p>
                            <p>{row.periodLabel}</p>
                        </article>
                    ))}
                </div>
            ) : null}

            {!isLoading && !loadingError && rows.length > 0 ? (
                <div className={styles.pagination}>
                    <button
                        type="button"
                        className={styles.pageArrow}
                        onClick={() => setActivePage((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={activePage === 1}
                    >
                        <IoChevronBackOutline size={16} />
                    </button>

                    {pageNumbers.map((pageNumber) => (
                        <button
                            key={pageNumber}
                            type="button"
                            className={[
                                styles.pageNumber,
                                activePage === pageNumber ? styles['pageNumber--active'] : '',
                            ].join(' ').trim()}
                            onClick={() => setActivePage(pageNumber)}
                        >
                            {pageNumber}
                        </button>
                    ))}

                    <button
                        type="button"
                        className={styles.pageArrow}
                        onClick={() => setActivePage((currentPage) => Math.min(pagesCount, currentPage + 1))}
                        disabled={activePage === pagesCount}
                    >
                        <IoChevronForwardOutline size={16} />
                    </button>
                </div>
            ) : null}
        </div>
    );
}

