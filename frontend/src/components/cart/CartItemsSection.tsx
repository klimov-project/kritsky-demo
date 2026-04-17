'use client';

import type { CartItemsSectionProps } from '@/types/ui/cartPage';

export default function CartItemsSection({
    items,
    isSubmitting,
    onChangeQuantity,
    onRemoveItem,
}: CartItemsSectionProps) {
    return (
        <section className="space-y-4">
            {items.map((item) => (
                <article key={item.id} className="bg-white border border-[#221E20]/10 rounded-xl p-4 flex gap-4">
                    <div className="w-[110px] h-[150px] bg-gray-100 rounded overflow-hidden shrink-0 flex items-center justify-center text-[10px] uppercase tracking-widest opacity-40">
                        {item.book.coverUrl ? (
                            <img src={item.book.coverUrl} alt={item.book.title} className="w-full h-full object-cover" />
                        ) : (
                            'Обложка'
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-xl font-bold leading-tight mb-1">{item.book.title}</h3>
                        <p className="text-sm opacity-60 mb-4">{item.book.author}</p>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center border border-[#221E20]/15 rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    className="w-9 h-9 text-lg"
                                    disabled={isSubmitting || item.quantity <= 1}
                                    onClick={() => void onChangeQuantity(item.bookId, item.quantity - 1)}
                                >
                                    -
                                </button>
                                <span className="w-10 text-center text-sm">{item.quantity}</span>
                                <button
                                    type="button"
                                    className="w-9 h-9 text-lg"
                                    disabled={isSubmitting}
                                    onClick={() => void onChangeQuantity(item.bookId, item.quantity + 1)}
                                >
                                    +
                                </button>
                            </div>

                            <div className="text-sm font-bold">{item.lineTotal} ₽</div>

                            <button
                                type="button"
                                className="text-xs text-red-600 hover:underline"
                                disabled={isSubmitting}
                                onClick={() => void onRemoveItem(item.bookId)}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </article>
            ))}
        </section>
    );
}
