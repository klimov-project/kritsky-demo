'use client';

import { FaBookmark } from 'react-icons/fa';

import Button from '@/components/shared/Button';
import { CATEGORY_LABELS, FULFILLMENT_LABELS } from '@/mocks/shop';
import type { ShopProductDetailsContentProps } from '@/types/ui/shopProductDetails';

export default function ShopProductDetailsContent({
    product,
    isBookmarked,
    activeImageIndex,
    displayImage,
    marketplaceLinks,
    cartMessage,
    onToggleBookmark,
    onAddToCart,
    onSelectImage,
    onGoToCart,
}: ShopProductDetailsContentProps) {
    return (
        <div className="w-full flex flex-col items-center min-h-screen pb-20">
            <div className="w-full max-w-[955px] px-4 md:px-0 flex flex-col pt-[90px]">
                <div className="flex flex-col md:flex-row gap-[25px]">
                    <div className="relative w-full md:w-[400px] h-[555px] bg-gray-100 shrink-0 border border-[#221E20] border-opacity-10">
                        <button
                            onClick={() => void onToggleBookmark()}
                            className={`absolute top-[15px] right-[10px] z-10 transition-colors ${isBookmarked ? 'text-[#cc0000]' : 'text-[#221E20] hover:text-[#cc0000]'}`}
                        >
                            <FaBookmark size={20} />
                        </button>

                        <div className="w-full h-full flex items-center justify-center text-[#221E20]/20 font-serif text-2xl">
                            {displayImage ? (
                                <img src={displayImage} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                                'PRODUCT IMAGE'
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-[11px] px-2 py-1 border border-[#221E20]/15 rounded-full uppercase tracking-wider">
                                {CATEGORY_LABELS[product.category] || product.category}
                            </span>
                            <span className="text-[11px] px-2 py-1 bg-[#F2D2C3] rounded-full uppercase tracking-wider">
                                {FULFILLMENT_LABELS[product.fulfillment]}
                            </span>
                        </div>

                        <h1 className="font-serif font-bold text-3xl md:text-4xl text-[#221E20] leading-tight max-w-[530px]">
                            {product.title}
                        </h1>

                        <div className="mt-[13px] font-serif text-lg text-[#221E20]/60">
                            {product.author}
                        </div>

                        <p className="mt-[35px] font-serif text-[16px] leading-relaxed text-[#221E20] max-w-[530px] opacity-80">
                            {product.description}
                        </p>

                        <div className="mt-[25px] flex flex-wrap gap-[15px]">
                            {product.tags.map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-[#221E20] text-sm font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="mt-[35px] grid grid-cols-4 gap-4">
                            {(product.gallery.length ? product.gallery : [product.coverUrl || '']).slice(0, 4).map((img, index) => (
                                <div
                                    key={`${img}-${index}`}
                                    className={`h-[80px] bg-gray-50 border cursor-pointer transition-all overflow-hidden ${activeImageIndex === index ? 'border-[#221E20]' : 'border-transparent hover:border-gray-300'}`}
                                    onClick={() => onSelectImage(index)}
                                >
                                    {img ? (
                                        <img src={img} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs opacity-30">IMG</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-[35px] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8">
                            <div className="flex flex-col gap-[10px]">
                                <div className="flex items-center gap-2 text-sm font-serif">
                                    <span className="opacity-50">Возрастные ограничения:</span>
                                    <span className="font-medium">{product.ageLimit || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-serif">
                                    <span className="opacity-50">Год:</span>
                                    <span className="font-medium">{product.year || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-serif">
                                    <span className="opacity-50">Формат:</span>
                                    <span className="font-medium">{product.format || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-serif">
                                    <span className="opacity-50">Страниц:</span>
                                    <span className="font-medium">{product.pages || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-serif">
                                    <span className="opacity-50">ISBN:</span>
                                    <span className="font-medium">{product.isbn || '—'}</span>
                                </div>
                                {product.collectionConfig ? (
                                    <>
                                        <div className="flex items-center gap-2 text-sm font-serif">
                                            <span className="opacity-50">Автор сборника:</span>
                                            <span className="font-medium">{product.collectionConfig.authorName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-serif">
                                            <span className="opacity-50">Вариантов в сборнике:</span>
                                            <span className="font-medium">{product.collectionConfig.variantsCount}</span>
                                        </div>
                                    </>
                                ) : null}
                                {product.downloadPackConfig ? (
                                    <div className="flex items-center gap-2 text-sm font-serif">
                                        <span className="opacity-50">Скачиваний в пакете:</span>
                                        <span className="font-medium">{product.downloadPackConfig.downloadsCount}</span>
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex flex-col items-end gap-4 w-full sm:w-auto">
                                <div className="text-3xl font-bold font-serif text-[#221E20]">
                                    {product.price} ₽
                                </div>
                                <div className="flex flex-col gap-2 w-full sm:w-[220px]">
                                    <Button variant="filled" className="w-full h-[45px]" onClick={() => void onAddToCart()}>
                                        В корзину
                                    </Button>
                                    <Button variant="outlined" className="w-full h-[45px]" onClick={onGoToCart}>
                                        Перейти в корзину
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {cartMessage && (
                            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                                {cartMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full max-w-[955px] mt-[95px] border-t border-[#221E20]/10" />

            <div className="w-full max-w-[1200px] mt-[75px] mb-[95px] flex flex-col items-center px-4 md:px-0">
                <h3 className="font-serif text-lg text-[#221E20]/60 mb-8 text-center">
                    Печатную версию можно купить здесь:
                </h3>
                <div className="flex flex-wrap justify-center gap-[20px]">
                    {marketplaceLinks.map((market, index) => (
                        <a
                            key={`${market.label}-${index}`}
                            href={market.url}
                            className="w-[180px] h-[45px] bg-gray-100 flex items-center justify-center rounded cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <span className="font-bold text-[#221E20]/40 text-sm uppercase">{market.label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
