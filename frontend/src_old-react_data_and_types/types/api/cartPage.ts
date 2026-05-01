import type { CartSummary, CheckoutPayload, CheckoutResult } from '@/types/shop';

export type CartPageState = CartSummary | null;

export type CartPageDeliveryType = CheckoutPayload['deliveryType'];

export type CartPageCheckoutResult = CheckoutResult;
