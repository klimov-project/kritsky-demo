'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { IoBagHandleOutline, IoHeartOutline, IoHeart } from 'react-icons/io5';
import type { ProductFulfillment } from '@/types/shop';
import styles from './ShopBookCard.module.scss';

interface ShopBookCardProps {
    id: string;
    title: string;
    description: string;
    price: number;
    categoryLabel: string;
    fulfillment: ProductFulfillment;
    imageUrl?: string;
    isBookmarked?: boolean;
    onToggleBookmark?: (id: string, nextValue: boolean) => void;
    onAddToCart?: (id: string) => void;
}

export default function ShopBookCard({
    id,
    title,
    description,
    price,
    categoryLabel,
    fulfillment,
    imageUrl,
    isBookmarked,
    onToggleBookmark,
    onAddToCart,
}: ShopBookCardProps) {
    const [internalBookmark, setInternalBookmark] = useState(false);
    const fulfillmentLabel = fulfillment === 'DIGITAL' ? 'Цифровой' : 'Физический';
    const bookmarked = typeof isBookmarked === 'boolean' ? isBookmarked : internalBookmark;

    return (
        <article className={styles.card}>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const next = !bookmarked;
                    if (onToggleBookmark) {
                        onToggleBookmark(id, next);
                        return;
                    }
                    setInternalBookmark(next);
                }}
                className={[
                    styles.bookmarkButton,
                    bookmarked ? styles['bookmarkButton--active'] : '',
                ].join(' ').trim()}
                aria-label="В закладки"
            >
                {bookmarked ? <IoHeart size={22} /> : <IoHeartOutline size={22} />}
            </button>

            <Link href={`/shop/${id}`} className={styles.linkWrap}>
                <div className={styles.coverWrap}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className={styles.cover}
                        />
                    ) : (
                        <div className={styles.coverPlaceholder}>
                            COVER
                        </div>
                    )}
                </div>

                <div className={styles.info}>
                    <div className={styles.tags}>
                        <span className={styles.tag}>
                            {categoryLabel}
                        </span>
                        <span className={styles.tag}>
                            {fulfillmentLabel}
                        </span>
                    </div>

                    <h3 className={styles.title}>
                        {title}
                    </h3>

                    <p className={styles.description}>
                        {description}
                    </p>
                </div>
            </Link>

            <div className={styles.actions}>
                <p className={styles.price}>{price} ₽</p>
                <button
                    type="button"
                    className={styles.cartButton}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onAddToCart?.(id);
                    }}
                >
                    <IoBagHandleOutline size={16} />
                    <span>В корзину</span>
                </button>
            </div>
        </article>
    );
}
