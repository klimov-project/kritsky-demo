import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
    checkoutCartPage,
    loadCartPageCart,
    removeCartPageItem,
    updateCartPageItemQuantity,
} from '@/lib/api/cartPage';
import type { CartPageDeliveryType, CartPageState } from '@/types/api/cartPage';
import type { UseCartPageResult } from '@/types/ui/cartPage';
import {
    getCartPageDeliveryAmount,
    getCartPageTotalAmount,
    hasCartPagePhysicalItems,
} from '@/utils/cartPage';

export const useCartPage = (): UseCartPageResult => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [cart, setCart] = useState<CartPageState>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [deliveryType, setDeliveryTypeState] = useState<CartPageDeliveryType>('without_delivery');
    const [deliveryAddress, setDeliveryAddressState] = useState('');
    const [recipientName, setRecipientNameState] = useState('');
    const [recipientPhone, setRecipientPhoneState] = useState('');

    const hasPhysicalItems = useMemo(
        () => hasCartPagePhysicalItems(cart),
        [cart],
    );

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user || user.role !== 'user') {
            router.replace('/?modal=login');
            return;
        }

        let cancelled = false;

        const load = async () => {
            setIsPageLoading(true);
            setError('');
            try {
                const response = await loadCartPageCart();
                if (!cancelled) {
                    setCart(response);
                }
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить корзину');
                }
            } finally {
                if (!cancelled) {
                    setIsPageLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [isAuthLoading, router, user]);

    useEffect(() => {
        if (hasPhysicalItems) return;

        setDeliveryTypeState('without_delivery');
        setDeliveryAddressState('');
        setRecipientNameState('');
        setRecipientPhoneState('');
    }, [hasPhysicalItems]);

    const deliveryAmount = useMemo(
        () => getCartPageDeliveryAmount(hasPhysicalItems, deliveryType),
        [deliveryType, hasPhysicalItems],
    );

    const totalAmount = useMemo(
        () => getCartPageTotalAmount(cart, deliveryAmount),
        [cart, deliveryAmount],
    );

    const setDeliveryType = useCallback((value: CartPageDeliveryType) => {
        setDeliveryTypeState(value);
    }, []);

    const setDeliveryAddress = useCallback((value: string) => {
        setDeliveryAddressState(value);
    }, []);

    const setRecipientName = useCallback((value: string) => {
        setRecipientNameState(value);
    }, []);

    const setRecipientPhone = useCallback((value: string) => {
        setRecipientPhoneState(value);
    }, []);

    const changeQuantity = useCallback(async (bookId: string, nextQuantity: number) => {
        if (nextQuantity < 1) return;

        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);
        try {
            const next = await updateCartPageItemQuantity(bookId, nextQuantity);
            setCart(next);
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось изменить количество');
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const removeItem = useCallback(async (bookId: string) => {
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);
        try {
            const next = await removeCartPageItem(bookId);
            setCart(next);
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось удалить товар из корзины');
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const handleCheckout = useCallback(async () => {
        if (!cart || cart.items.length === 0) return;

        const effectiveDeliveryType: CartPageDeliveryType = hasPhysicalItems ? deliveryType : 'without_delivery';

        if (effectiveDeliveryType === 'with_delivery' && !deliveryAddress.trim()) {
            setError('Укажите адрес доставки.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');

        try {
            const result = await checkoutCartPage({
                deliveryType: effectiveDeliveryType,
                deliveryAddress: effectiveDeliveryType === 'with_delivery' ? deliveryAddress : '',
                recipientName: hasPhysicalItems ? recipientName : '',
                recipientPhone: hasPhysicalItems ? recipientPhone : '',
            });

            const nextCart = await loadCartPageCart();
            setCart(nextCart);
            setSuccessMessage(`Заказ #${result.orderId} оформлен. Моковая оплата прошла успешно.`);
            setDeliveryAddressState('');
            setRecipientNameState('');
            setRecipientPhoneState('');
            setDeliveryTypeState('without_delivery');
        } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : 'Не удалось оформить заказ');
        } finally {
            setIsSubmitting(false);
        }
    }, [cart, deliveryAddress, deliveryType, hasPhysicalItems, recipientName, recipientPhone]);

    const goToShop = useCallback(() => {
        router.push('/shop');
    }, [router]);

    const goToMyBooks = useCallback(() => {
        router.push('/my-books');
    }, [router]);

    const openFeedbackModal = useCallback(() => {
        const targetPath = pathname || '/cart';
        router.push(`${targetPath}?modal=feedback`);
    }, [pathname, router]);

    return {
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
        openFeedbackModal,
    };
};
