'use client';

import type { ShopProductDetailsMarketplaceLink } from '@/types/api/shopProductDetails';

import styles from './ShopMarketplaceLinks.module.scss';

interface ShopMarketplaceLinksProps {
    items: ShopProductDetailsMarketplaceLink[];
}

export default function ShopMarketplaceLinks({ items }: ShopMarketplaceLinksProps) {
    if (!items.length) {
        return null;
    }

    return (
        <section className={styles.wrap}>
            <h3 className={styles.title}>Печатную версию можно купить здесь:</h3>
            <div className={styles.list}>
                {items.map((marketplace, index) => (
                    <a
                        key={`${marketplace.label}-${index}`}
                        href={marketplace.url}
                        className={styles.link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {marketplace.label}
                    </a>
                ))}
            </div>
        </section>
    );
}
