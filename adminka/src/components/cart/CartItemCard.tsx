'use client';

import { FiTrash2 } from 'react-icons/fi';

import type { CartItemCardProps } from '@/types/ui/cartPage';

import styles from './CartItemCard.module.scss';

export default function CartItemCard({
    item,
    isSubmitting,
    onChangeQuantity,
    onRemoveItem,
}: CartItemCardProps) {
    return (
        <article className={styles.card}>
            <div className={styles.coverWrap}>
                {item.book.coverUrl ? (
                    <img src={item.book.coverUrl} alt={item.book.title} className={styles.cover} />
                ) : (
                    <div className={styles.coverPlaceholder}>Обложка</div>
                )}
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{item.book.title}</h3>
                <p className={styles.description}>
                    {item.book.description || `Автор: ${item.book.author}`}
                </p>

                <div className={styles.footer}>
                    <div className={styles.quantityControl}>
                        <button
                            type="button"
                            className={styles.quantityButton}
                            disabled={isSubmitting || item.quantity <= 1}
                            onClick={() => void onChangeQuantity(item.bookId, item.quantity - 1)}
                            aria-label="Уменьшить количество"
                        >
                            -
                        </button>
                        <span className={styles.quantityValue}>{item.quantity}</span>
                        <button
                            type="button"
                            className={styles.quantityButton}
                            disabled={isSubmitting}
                            onClick={() => void onChangeQuantity(item.bookId, item.quantity + 1)}
                            aria-label="Увеличить количество"
                        >
                            +
                        </button>
                    </div>

                    <p className={styles.price}>{item.lineTotal} ₽</p>
                </div>
            </div>

            <button
                type="button"
                className={styles.removeButton}
                disabled={isSubmitting}
                onClick={() => void onRemoveItem(item.bookId)}
                aria-label="Удалить товар"
            >
                <FiTrash2 size={20} />
            </button>
        </article>
    );
}
