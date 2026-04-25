'use client';

import { useMemo } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { FiCheck, FiMail, FiShoppingBag, FiUser } from 'react-icons/fi';

import ShopMarketplaceLinks from '@/components/shop/details/ShopMarketplaceLinks';
import ShopProductImageStrip from '@/components/shop/details/ShopProductImageStrip';
import type { ShopProductDetailsContentProps } from '@/types/ui/shopProductDetails';

import styles from './ShopProductDetailsContent.module.scss';

export default function ShopProductDetailsContent({
    product,
    isBookmarked,
    activeImageIndex,
    displayImage,
    marketplaceLinks,
    cartMessage,
    onToggleBookmark,
    onAddToCart,
    onSelectImage,
    onGoToCart,
    onOpenFeedback,
}: ShopProductDetailsContentProps) {
    const galleryImages = useMemo(() => {
        const baseImages = [
            ...(product.gallery || []),
            product.coverUrl || '',
        ].filter(Boolean);

        if (!baseImages.length) {
            return ['', '', '', ''];
        }

        if (baseImages.length >= 4) {
            return baseImages.slice(0, 4);
        }

        return Array.from({ length: 4 }, (_, index) => baseImages[index % baseImages.length]);
    }, [product.coverUrl, product.gallery]);

    const productSpecs = [
        `Возрастные ограничения: ${product.ageLimit || '—'}`,
        `Год издания: ${product.year || '—'}`,
        `Объем: ${product.pages ? `${product.pages} страниц` : '—'}`,
        `Формат: ${product.format || '—'}`,
        `ISBN: ${product.isbn || '—'}`,
    ];

    if (product.collectionConfig) {
        productSpecs.push(`Автор сборника: ${product.collectionConfig.authorName}`);
        productSpecs.push(`Вариантов в сборнике: ${product.collectionConfig.variantsCount}`);
    }

    if (product.downloadPackConfig) {
        productSpecs.push(`Скачиваний в пакете: ${product.downloadPackConfig.downloadsCount}`);
    }

    return (
        <div className={styles.page}>
            <div className={styles.contentRow}>
                <button type="button" className={styles.feedbackButton} onClick={onOpenFeedback}>
                    <FiMail size={16} />
                    <span>Обратная связь</span>
                </button>

                <article className={styles.productCard}>
                    <div className={styles.coverWrap}>
                        <button
                            type="button"
                            onClick={() => void onToggleBookmark()}
                            className={styles.favoriteButton}
                            aria-label="Добавить в избранное"
                        >
                            {isBookmarked ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
                        </button>

                        <div className={styles.coverInner}>
                            {displayImage ? (
                                <img src={displayImage} alt={product.title} className={styles.coverImage} />
                            ) : (
                                <span className={styles.coverPlaceholder}>PRODUCT IMAGE</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.details}>
                        <button
                            type="button"
                            onClick={() => void onToggleBookmark()}
                            className={styles.favoriteButtonMobile}
                            aria-label="Добавить в избранное"
                        >
                            {isBookmarked ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
                        </button>

                        <h1 className={styles.title}>{product.title}</h1>

                        <p className={styles.authorLine}>
                            <FiUser size={14} />
                            <span>Автор: {product.author}</span>
                        </p>

                        <p className={styles.description}>{product.description}</p>

                        <ShopProductImageStrip
                            images={galleryImages}
                            activeIndex={Math.min(activeImageIndex, galleryImages.length - 1)}
                            title={product.title}
                            onSelectImage={onSelectImage}
                        />

                        <div className={styles.bottomRow}>
                            <ul className={styles.specs}>
                                {productSpecs.map((spec) => (
                                    <li key={spec}>{spec}</li>
                                ))}
                            </ul>

                            <div className={styles.actions}>
                                <p className={styles.price}>{product.price} ₽</p>
                                <button type="button" className={styles.secondaryButton} onClick={() => void onAddToCart()}>
                                    <FiShoppingBag size={14} />
                                    <span>В корзину</span>
                                </button>
                                <button type="button" className={styles.primaryButton} onClick={onGoToCart}>
                                    <FiCheck size={14} />
                                    <span>Оформить</span>
                                </button>
                            </div>
                        </div>

                        {cartMessage && (
                            <div className={styles.successMessage}>
                                {cartMessage}
                            </div>
                        )}
                    </div>
                </article>
            </div>

            <ShopMarketplaceLinks items={marketplaceLinks} />

            <button type="button" className={styles.feedbackButtonMobile} onClick={onOpenFeedback}>
                <FiMail size={16} />
                <span>Обратная связь</span>
            </button>
        </div>
    );
}
