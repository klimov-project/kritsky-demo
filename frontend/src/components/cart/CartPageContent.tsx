'use client';

import Button from '@/components/shared/Button';
import CartCheckoutPanel from '@/components/cart/CartCheckoutPanel';
import CartItemsSection from '@/components/cart/CartItemsSection';
import type { CartPageContentProps } from '@/types/ui/cartPage';

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
}: CartPageContentProps) {
    return (
        <div className="w-full max-w-[1100px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
            <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                    <h1 className="font-serif text-4xl font-bold text-[#221E20]">Корзина</h1>
                    <p className="text-[#221E20]/60 mt-2">Добавляйте товары, меняйте количество и оформляйте заказ.</p>
                </div>
                <Button variant="outlined" onClick={onGoToShop}>В магазин</Button>
            </div>

            {isPageLoading && <div className="text-sm opacity-60">Загружаю корзину...</div>}

            {!isPageLoading && error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
            )}

            {!isPageLoading && successMessage && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">{successMessage}</div>
            )}

            {!isPageLoading && cart && cart.items.length === 0 && (
                <div className="bg-white border border-[#221E20]/10 rounded-xl p-6 text-sm text-[#221E20]/60 flex flex-col gap-4 items-start">
                    <div>Корзина пуста.</div>
                    <Button variant="outlined" onClick={onGoToShop}>Перейти в магазин</Button>
                </div>
            )}

            {!isPageLoading && cart && cart.items.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                    <CartItemsSection
                        items={cart.items}
                        isSubmitting={isSubmitting}
                        onChangeQuantity={onChangeQuantity}
                        onRemoveItem={onRemoveItem}
                    />

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
                </div>
            )}
        </div>
    );
}
