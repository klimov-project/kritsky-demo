'use client';

import CartItemCard from '@/components/cart/CartItemCard';
import type { CartItemsSectionProps } from '@/types/ui/cartPage';

import styles from './CartItemsSection.module.scss';

export default function CartItemsSection({
    items,
    isSubmitting,
    onChangeQuantity,
    onRemoveItem,
}: CartItemsSectionProps) {
    return (
        <section className={styles.section}>
            {items.map((item) => (
                <CartItemCard
                    key={item.id}
                    item={item}
                    isSubmitting={isSubmitting}
                    onChangeQuantity={onChangeQuantity}
                    onRemoveItem={onRemoveItem}
                />
            ))}
        </section>
    );
}
