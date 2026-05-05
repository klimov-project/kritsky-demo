'use client';

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import styles from './ShopProductImageStrip.module.scss';

interface ShopProductImageStripProps {
    images: string[];
    activeIndex: number;
    title: string;
    onSelectImage: (index: number) => void;
}

export default function ShopProductImageStrip({
    images,
    activeIndex,
    title,
    onSelectImage,
}: ShopProductImageStripProps) {
    const hasImages = images.length > 0;
    const lastIndex = hasImages ? images.length - 1 : 0;

    const handlePrev = () => {
        if (!hasImages) return;
        onSelectImage(activeIndex === 0 ? lastIndex : activeIndex - 1);
    };

    const handleNext = () => {
        if (!hasImages) return;
        onSelectImage(activeIndex === lastIndex ? 0 : activeIndex + 1);
    };

    return (
        <div className={styles.strip}>
            <button type="button" className={styles.arrowButton} onClick={handlePrev} aria-label="Предыдущий скриншот">
                <FiChevronLeft size={20} />
            </button>

            <div className={styles.thumbnails}>
                {images.map((imageUrl, index) => (
                    <button
                        key={`${imageUrl || 'empty'}-${index}`}
                        type="button"
                        className={[
                            styles.thumbButton,
                            activeIndex === index ? styles.thumbButtonActive : '',
                        ].join(' ').trim()}
                        onClick={() => onSelectImage(index)}
                        aria-label={`Скриншот ${index + 1}`}
                    >
                        {imageUrl ? (
                            <img src={imageUrl} alt={`${title} ${index + 1}`} className={styles.thumbImage} />
                        ) : (
                            <span className={styles.thumbPlaceholder}>IMG</span>
                        )}
                    </button>
                ))}
            </div>

            <button type="button" className={styles.arrowButton} onClick={handleNext} aria-label="Следующий скриншот">
                <FiChevronRight size={20} />
            </button>
        </div>
    );
}
