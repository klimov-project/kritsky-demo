'use client';

import { FiMail } from 'react-icons/fi';

import Button from '@/components/shared/Button';
import CartCheckoutPanel from '@/components/cart/CartCheckoutPanel';
import CartItemsSection from '@/components/cart/CartItemsSection';
import type { CartPageContentProps } from '@/types/ui/cartPage';

import styles from './CartPageContent.module.scss';

export default function CartPageContent({
    isPageLoading,
    error,
    successMessage,
    cart,
    isSubmitting,
    hasPhysicalItems,
    deliveryType,
    deliveryAddress,
    recipientName,
    recipientPhone,
    deliveryAmount,
    totalAmount,
    onGoToShop,
    onGoToMyBooks,
    onDeliveryTypeChange,
    onDeliveryAddressChange,
    onRecipientNameChange,
    onRecipientPhoneChange,
    onChangeQuantity,
    onRemoveItem,
    onCheckout,
    onOpenFeedback,
}: CartPageContentProps) {
    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Корзина</h1>

            {isPageLoading && <div className={styles.statusText}>Загружаю корзину...</div>}

            {!isPageLoading && error && (
                <div className={`${styles.notice} ${styles.noticeError}`}>{error}</div>
            )}

            {!isPageLoading && successMessage && (
                <div className={`${styles.notice} ${styles.noticeSuccess}`}>{successMessage}</div>
            )}

            {!isPageLoading && cart && cart.items.length === 0 && (
                <div className={styles.emptyState}>
                    <div>Корзина пуста.</div>
                    <Button variant="outlined" onClick={onGoToShop}>Перейти в магазин</Button>
                </div>
            )}

            {!isPageLoading && cart && cart.items.length > 0 && (
                <div className={styles.contentGrid}>
                    <CartItemsSection
                        items={cart.items}
                        isSubmitting={isSubmitting}
                        onChangeQuantity={onChangeQuantity}
                        onRemoveItem={onRemoveItem}
                    />

                    <div className={styles.sideColumn}>
                        <CartCheckoutPanel
                            cartTotalAmount={cart.totalAmount}
                            deliveryAmount={deliveryAmount}
                            totalAmount={totalAmount}
                            hasPhysicalItems={hasPhysicalItems}
                            deliveryType={deliveryType}
                            deliveryAddress={deliveryAddress}
                            recipientName={recipientName}
                            recipientPhone={recipientPhone}
                            isSubmitting={isSubmitting}
                            onDeliveryTypeChange={onDeliveryTypeChange}
                            onDeliveryAddressChange={onDeliveryAddressChange}
                            onRecipientNameChange={onRecipientNameChange}
                            onRecipientPhoneChange={onRecipientPhoneChange}
                            onCheckout={onCheckout}
                            onGoToMyBooks={onGoToMyBooks}
                        />

                        <button type="button" className={styles.feedbackButton} onClick={onOpenFeedback}>
                            <FiMail size={16} />
                            <span>Обратная связь</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
