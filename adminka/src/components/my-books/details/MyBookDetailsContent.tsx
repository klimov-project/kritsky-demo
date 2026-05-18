'use client';

import Link from 'next/link';

import Button from '@/components/shared/Button';
import MyBookGeneratedCollectionSection from '@/components/my-books/details/MyBookGeneratedCollectionSection';
import type { MyBookDetailsContentProps } from '@/types/ui/myBookDetails';
import {
    formatMyBookDetailsDate,
    MY_BOOK_DETAILS_CATEGORY_LABELS,
    MY_BOOK_DETAILS_FULFILLMENT_LABELS,
} from '@/utils/myBookDetails';

export default function MyBookDetailsContent({
    purchase,
    revealedAnswers,
    onToggleAnswers,
    onPrint,
    onDownloadPdf,
    onGoToShopProduct,
}: MyBookDetailsContentProps) {
    const generatedCollection = purchase.generatedCollection;

    return (
        <div className="w-full max-w-[980px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
            <div className="mb-8">
                <Link href="/my-books" className="text-sm text-[#221E20]/60 hover:text-[#221E20] transition-colors">
                    ← Назад к покупкам
                </Link>
                <h1 className="font-serif text-4xl font-bold text-[#221E20] mt-3">{purchase.title}</h1>
                <p className="text-[#221E20]/60 mt-2">
                    Куплено: {formatMyBookDetailsDate(purchase.purchasedAt)} • Тип: {MY_BOOK_DETAILS_FULFILLMENT_LABELS[purchase.fulfillment] || purchase.fulfillment}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
                <div className="border border-[#221E20]/10 rounded-xl overflow-hidden bg-gray-100 h-[420px]">
                    {purchase.coverUrl ? (
                        <img src={purchase.coverUrl} alt={purchase.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#221E20]/40 uppercase tracking-widest text-xs">
                            Обложка
                        </div>
                    )}
                </div>

                <div className="border border-[#221E20]/10 rounded-xl p-6 bg-white flex flex-col">
                    <h2 className="font-serif text-2xl font-bold mb-4">Информация о товаре</h2>
                    <p className="text-[#221E20]/80 leading-relaxed">{purchase.description || 'Описание пока отсутствует.'}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm text-[#221E20]/75">
                        <div><span className="opacity-60">Категория:</span> {MY_BOOK_DETAILS_CATEGORY_LABELS[purchase.category] || purchase.category}</div>
                        <div><span className="opacity-60">Стоимость:</span> {purchase.total} ₽</div>
                        <div><span className="opacity-60">Автор:</span> {purchase.author || '—'}</div>
                        <div><span className="opacity-60">Количество:</span> {purchase.quantity}</div>
                        {purchase.collectionConfig ? <div><span className="opacity-60">Автор сборника:</span> {purchase.collectionConfig.authorName}</div> : null}
                        {purchase.collectionConfig ? <div><span className="opacity-60">Вариантов:</span> {purchase.collectionConfig.variantsCount}</div> : null}
                        {purchase.downloadPackConfig ? <div><span className="opacity-60">Скачиваний в пакете:</span> {purchase.downloadPackConfig.downloadsCount}</div> : null}
                    </div>

                    <div className="mt-8 p-4 rounded-lg bg-[#FAF8F7] border border-[#221E20]/10 text-sm text-[#221E20]/70">
                        {generatedCollection
                            ? `Сборник сформирован автоматически. Внутри ${generatedCollection.variantsCount} вариантов по автору ${generatedCollection.authorName}.`
                            : purchase.downloadPackConfig
                                ? `Скачивания начислены на баланс аккаунта. В этом товаре: ${purchase.downloadPackConfig.downloadsCount} скачиваний за единицу товара.`
                            : purchase.fulfillment === 'DIGITAL'
                                ? `Ваш файл доступен к скачиванию: ${purchase.digitalFileName || 'digital-file.pdf'}`
                                : 'Для физического товара статус доставки будет обновляться в вашем профиле.'}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {purchase.fulfillment === 'PHYSICAL' ? (
                            <Button variant="filled">Узнать статус доставки</Button>
                        ) : null}
                        {purchase.bookId ? (
                            <Button
                                variant="outlined"
                                onClick={() => onGoToShopProduct(purchase.bookId as string)}
                            >
                                Открыть карточку в магазине
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>

            {generatedCollection ? (
                <MyBookGeneratedCollectionSection
                    packs={generatedCollection.packs}
                    purchaseQuantity={purchase.quantity}
                    authorName={generatedCollection.authorName || ''}
                    revealedAnswers={revealedAnswers}
                    onToggleAnswers={onToggleAnswers}
                    onDownloadPdf={onDownloadPdf}
                    onPrint={onPrint}
                />
            ) : null}
        </div>
    );
}
