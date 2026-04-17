import type { AuthUser } from '@/lib/authApi';
import type { CartPageDeliveryType, CartPageState } from '@/types/api/cartPage';
import type { CartLineItem } from '@/types/shop';

export interface CartItemsSectionProps {
    items: CartLineItem[];
    isSubmitting: boolean;
    onChangeQuantity: (bookId: string, nextQuantity: number) => Promise<void>;
    onRemoveItem: (bookId: string) => Promise<void>;
}

export interface CartCheckoutPanelProps {
    cartTotalAmount: number;
    deliveryAmount: number;
    totalAmount: number;
    hasPhysicalItems: boolean;
    deliveryType: CartPageDeliveryType;
    deliveryAddress: string;
    recipientName: string;
    recipientPhone: string;
    isSubmitting: boolean;
    onDeliveryTypeChange: (value: CartPageDeliveryType) => void;
    onDeliveryAddressChange: (value: string) => void;
    onRecipientNameChange: (value: string) => void;
    onRecipientPhoneChange: (value: string) => void;
    onCheckout: () => Promise<void>;
    onGoToMyBooks: () => void;
}

export interface CartPageContentProps {
    isPageLoading: boolean;
    error: string;
    successMessage: string;
    cart: CartPageState;
    isSubmitting: boolean;
    hasPhysicalItems: boolean;
    deliveryType: CartPageDeliveryType;
    deliveryAddress: string;
    recipientName: string;
    recipientPhone: string;
    deliveryAmount: number;
    totalAmount: number;
    onGoToShop: () => void;
    onGoToMyBooks: () => void;
    onDeliveryTypeChange: (value: CartPageDeliveryType) => void;
    onDeliveryAddressChange: (value: string) => void;
    onRecipientNameChange: (value: string) => void;
    onRecipientPhoneChange: (value: string) => void;
    onChangeQuantity: (bookId: string, nextQuantity: number) => Promise<void>;
    onRemoveItem: (bookId: string) => Promise<void>;
    onCheckout: () => Promise<void>;
}

export interface UseCartPageResult {
    user: AuthUser | null;
    isAuthLoading: boolean;
    cart: CartPageState;
    isPageLoading: boolean;
    isSubmitting: boolean;
    error: string;
    successMessage: string;
    deliveryType: CartPageDeliveryType;
    deliveryAddress: string;
    recipientName: string;
    recipientPhone: string;
    hasPhysicalItems: boolean;
    deliveryAmount: number;
    totalAmount: number;
    setDeliveryType: (value: CartPageDeliveryType) => void;
    setDeliveryAddress: (value: string) => void;
    setRecipientName: (value: string) => void;
    setRecipientPhone: (value: string) => void;
    changeQuantity: (bookId: string, nextQuantity: number) => Promise<void>;
    removeItem: (bookId: string) => Promise<void>;
    handleCheckout: () => Promise<void>;
    goToShop: () => void;
    goToMyBooks: () => void;
}
