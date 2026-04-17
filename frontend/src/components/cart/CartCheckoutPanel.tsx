'use client';

import Button from '@/components/shared/Button';
import type { CartPageDeliveryType } from '@/types/api/cartPage';
import type { CartCheckoutPanelProps } from '@/types/ui/cartPage';
import { CART_PAGE_DELIVERY_LABELS } from '@/utils/cartPage';

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
    return (
        <aside className="bg-white border border-[#221E20]/10 rounded-xl p-5 h-fit space-y-5">
            <h2 className="font-serif text-2xl font-bold">Оформление</h2>

            {hasPhysicalItems ? (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-bold opacity-60 uppercase">Тип доставки</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(CART_PAGE_DELIVERY_LABELS) as CartPageDeliveryType[]).map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`h-10 rounded-lg border text-sm ${deliveryType === value ? 'border-[#221E20] bg-[#F2D2C3]/40' : 'border-[#221E20]/15'}`}
                                    onClick={() => onDeliveryTypeChange(value)}
                                    disabled={isSubmitting}
                                >
                                    {CART_PAGE_DELIVERY_LABELS[value]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold opacity-60 uppercase">Получатель</label>
                        <input
                            value={recipientName}
                            onChange={(event) => onRecipientNameChange(event.target.value)}
                            placeholder="Имя"
                            className="w-full h-10 px-3 border border-[#221E20]/15 rounded-lg text-sm"
                        />
                        <input
                            value={recipientPhone}
                            onChange={(event) => onRecipientPhoneChange(event.target.value)}
                            placeholder="Телефон"
                            className="w-full h-10 px-3 border border-[#221E20]/15 rounded-lg text-sm"
                        />
                    </div>

                    {deliveryType === 'with_delivery' ? (
                        <div className="space-y-2">
                            <label className="text-xs font-bold opacity-60 uppercase">Адрес доставки</label>
                            <textarea
                                value={deliveryAddress}
                                onChange={(event) => onDeliveryAddressChange(event.target.value)}
                                placeholder="Город, улица, дом, квартира"
                                className="w-full h-24 p-3 border border-[#221E20]/15 rounded-lg text-sm resize-none"
                            />
                        </div>
                    ) : null}
                </>
            ) : (
                <div className="space-y-2">
                    <label className="text-xs font-bold opacity-60 uppercase">Доставка</label>
                    <div className="rounded-xl border border-[#221E20]/10 bg-[#FAF8F7] px-4 py-3 text-sm text-[#221E20]/70">
                        В корзине только цифровые товары. Доставка для них не оформляется.
                    </div>
                </div>
            )}

            <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="opacity-60">Товары</span>
                    <span>{cartTotalAmount} ₽</span>
                </div>
                {hasPhysicalItems ? (
                    <div className="flex justify-between">
                        <span className="opacity-60">Доставка</span>
                        <span>{deliveryAmount} ₽</span>
                    </div>
                ) : null}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-dashed border-[#221E20]/15">
                    <span>Итого</span>
                    <span>{totalAmount} ₽</span>
                </div>
            </div>

            <Button variant="filled" className="w-full" disabled={isSubmitting} onClick={() => void onCheckout()}>
                {isSubmitting ? 'Оформляю...' : 'Оформить (моковая оплата)'}
            </Button>

            <Button variant="outlined" className="w-full" onClick={onGoToMyBooks}>
                Мои покупки
            </Button>
        </aside>
    );
}
