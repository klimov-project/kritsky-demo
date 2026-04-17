'use client';

import PageLayout from '@/components/layout/PageLayout';
import CartPageContent from '@/components/cart/CartPageContent';
import { useCartPage } from '@/hooks/useCartPage';

export default function CartPage() {
    const {
        user,
        isAuthLoading,
        cart,
        isPageLoading,
        isSubmitting,
        error,
        successMessage,
        deliveryType,
        deliveryAddress,
        recipientName,
        recipientPhone,
        hasPhysicalItems,
        deliveryAmount,
        totalAmount,
        setDeliveryType,
        setDeliveryAddress,
        setRecipientName,
        setRecipientPhone,
        changeQuantity,
        removeItem,
        handleCheckout,
        goToShop,
        goToMyBooks,
    } = useCartPage();

    if (isAuthLoading || !user || user.role !== 'user') {
        return null;
    }

    return (
        <PageLayout>
            <CartPageContent
                isPageLoading={isPageLoading}
                error={error}
                successMessage={successMessage}
                cart={cart}
                isSubmitting={isSubmitting}
                hasPhysicalItems={hasPhysicalItems}
                deliveryType={deliveryType}
                deliveryAddress={deliveryAddress}
                recipientName={recipientName}
                recipientPhone={recipientPhone}
                deliveryAmount={deliveryAmount}
                totalAmount={totalAmount}
                onGoToShop={goToShop}
                onGoToMyBooks={goToMyBooks}
                onDeliveryTypeChange={setDeliveryType}
                onDeliveryAddressChange={setDeliveryAddress}
                onRecipientNameChange={setRecipientName}
                onRecipientPhoneChange={setRecipientPhone}
                onChangeQuantity={changeQuantity}
                onRemoveItem={removeItem}
                onCheckout={handleCheckout}
            />
        </PageLayout>
    );
}
