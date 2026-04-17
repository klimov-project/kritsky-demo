import type { CartPageDeliveryType } from '@/types/api/cartPage';

export const CART_PAGE_DELIVERY_LABELS: Record<CartPageDeliveryType, string> = {
    with_delivery: 'С доставкой',
    without_delivery: 'Без доставки',
};
