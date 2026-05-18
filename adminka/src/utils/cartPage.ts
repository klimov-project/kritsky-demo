import { CART_PAGE_DELIVERY_LABELS } from '@/consts/utils/cartPage';
import type { CartPageState } from '@/types/api/cartPage';
import type { CartPageDeliveryType } from '@/types/api/cartPage';

export { CART_PAGE_DELIVERY_LABELS };

export const hasCartPagePhysicalItems = (cart: CartPageState): boolean => {
    return (cart?.items || []).some((item) => item.book.fulfillment === 'PHYSICAL');
};

export const getCartPageDeliveryAmount = (
    hasPhysicalItems: boolean,
    deliveryType: CartPageDeliveryType,
): number => {
    return hasPhysicalItems && deliveryType === 'with_delivery' ? 390 : 0;
};

export const getCartPageTotalAmount = (
    cart: CartPageState,
    deliveryAmount: number,
): number => {
    return Number((cart?.totalAmount || 0) + deliveryAmount);
};
