import { checkoutCart, getCart, removeProductFromCart, updateCartItemQuantity } from '@/lib/shopApi';
import type { CartPageCheckoutResult, CartPageDeliveryType } from '@/types/api/cartPage';
import type { CartSummary } from '@/types/shop';

export const loadCartPageCart = async (): Promise<CartSummary> => {
    return getCart();
};

export const updateCartPageItemQuantity = async (bookId: string, quantity: number): Promise<CartSummary> => {
    return updateCartItemQuantity(bookId, quantity);
};

export const removeCartPageItem = async (bookId: string): Promise<CartSummary> => {
    return removeProductFromCart(bookId);
};

export const checkoutCartPage = async (payload: {
    deliveryType: CartPageDeliveryType;
    deliveryAddress: string;
    recipientName: string;
    recipientPhone: string;
}): Promise<CartPageCheckoutResult> => {
    return checkoutCart({
        deliveryType: payload.deliveryType,
        deliveryAddress: payload.deliveryAddress,
        recipientName: payload.recipientName,
        recipientPhone: payload.recipientPhone,
        paymentMethod: 'Mock',
    });
};
