'use client';

import { FiDownload } from 'react-icons/fi';

import type { MyBookPurchaseCardProps } from '@/types/ui/myBooks';
import { MY_BOOKS_FULFILLMENT_LABELS } from '@/utils/myBooks';
import styles from './MyBooksPageContent.module.scss';

export default function MyBookPurchaseCard({ purchase, onOpenPurchase }: MyBookPurchaseCardProps) {
    return (
        <article className={styles.purchaseCard}>
            <div className={styles.cover}>
                {purchase.coverUrl ? (
                    <img src={purchase.coverUrl} alt={purchase.title} />
                ) : (
                    <span>Обложка</span>
                )}
            </div>

            <div className={styles.purchaseInfo}>
                <span className={styles.fulfillmentBadge}>
                    {MY_BOOKS_FULFILLMENT_LABELS[purchase.fulfillment] || purchase.fulfillment}
                </span>
                <h2 className={styles.purchaseTitle}>{purchase.title}</h2>
            </div>

            <button
                type="button"
                className={styles.downloadButton}
                onClick={() => onOpenPurchase(purchase.id)}
            >
                <FiDownload size={16} />
                <span>Скачать</span>
            </button>
        </article>
    );
}
