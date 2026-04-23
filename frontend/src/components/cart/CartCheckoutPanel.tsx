'use client';

import type { CartPageDeliveryType } from '@/types/api/cartPage';
import type { CartCheckoutPanelProps } from '@/types/ui/cartPage';
import { CART_PAGE_DELIVERY_LABELS } from '@/utils/cartPage';

import styles from './CartCheckoutPanel.module.scss';

export default function CartCheckoutPanel({
    cartTotalAmount,
    deliveryAmount,
    totalAmount,
    hasPhysicalItems,
    deliveryType,
    deliveryAddress,
    recipientName,
    recipientPhone,
    isSubmitting,
    onDeliveryTypeChange,
    onDeliveryAddressChange,
    onRecipientNameChange,
    onRecipientPhoneChange,
    onCheckout,
    onGoToMyBooks,
}: CartCheckoutPanelProps) {
    const primaryButtonLabel = isSubmitting ? 'Оформляю...' : 'Оформить';

    return (
        <aside className={styles.panel}>
            <h2 className={styles.title}>Оформление</h2>

            {hasPhysicalItems ? (
                <>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Тип доставки</label>
                        <div className={styles.deliveryButtons}>
                            {(Object.keys(CART_PAGE_DELIVERY_LABELS) as CartPageDeliveryType[]).map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={[
                                        styles.deliveryButton,
                                        deliveryType === value ? styles.deliveryButtonActive : '',
                                    ].join(' ').trim()}
                                    onClick={() => onDeliveryTypeChange(value)}
                                    disabled={isSubmitting}
                                >
                                    {CART_PAGE_DELIVERY_LABELS[value]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Получатель</label>
                        <input
                            value={recipientName}
                            onChange={(event) => onRecipientNameChange(event.target.value)}
                            placeholder="Имя"
                            className={styles.input}
                        />
                        <input
                            value={recipientPhone}
                            onChange={(event) => onRecipientPhoneChange(event.target.value)}
                            placeholder="Телефон"
                            className={styles.input}
                        />
                    </div>

                    {deliveryType === 'with_delivery' ? (
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Адрес доставки</label>
                            <textarea
                                value={deliveryAddress}
                                onChange={(event) => onDeliveryAddressChange(event.target.value)}
                                placeholder="Город, улица, дом, квартира"
                                className={styles.textarea}
                            />
                        </div>
                    ) : null}
                </>
            ) : (
                <div className={styles.fieldGroup}>
                    <p className={styles.deliveryHint}>
                        В корзине только цифровые товары. Доставка для них не оформляется.
                    </p>
                </div>
            )}

            <div className={styles.summary}>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Товар</span>
                    <span className={styles.summaryValue}>{cartTotalAmount} ₽</span>
                </div>
                {hasPhysicalItems ? (
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Доставка</span>
                        <span className={styles.summaryValue}>{deliveryAmount} ₽</span>
                    </div>
                ) : null}
                <div className={styles.summaryDivider} />
                <div className={styles.totalRow}>
                    <span>ИТОГО</span>
                    <span>{totalAmount} ₽</span>
                </div>
            </div>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                    disabled={isSubmitting}
                    onClick={() => void onCheckout()}
                >
                    {primaryButtonLabel}
                </button>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                    onClick={onGoToMyBooks}
                >
                    Мои покупки
                </button>
            </div>
        </aside>
    );
}
