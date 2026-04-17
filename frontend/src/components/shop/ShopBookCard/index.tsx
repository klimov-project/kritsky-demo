'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaBookmark } from 'react-icons/fa';
import type { ProductFulfillment } from '@/types/shop';

interface ShopBookCardProps {
    id: string;
    title: string;
    description: string;
    price: number;
    categoryLabel: string;
    fulfillment: ProductFulfillment;
    imageUrl?: string;
    isBookmarked?: boolean;
    onToggleBookmark?: (id: string, nextValue: boolean) => void;
    onAddToCart?: (id: string) => void;
}

export default function ShopBookCard({
    id,
    title,
    description,
    price,
    categoryLabel,
    fulfillment,
    imageUrl,
    isBookmarked,
    onToggleBookmark,
    onAddToCart,
}: ShopBookCardProps) {
    const [internalBookmark, setInternalBookmark] = useState(false);
    const fulfillmentLabel = fulfillment === 'DIGITAL' ? 'Цифровой' : 'Физический';
    const bookmarked = typeof isBookmarked === 'boolean' ? isBookmarked : internalBookmark;

    return (
        <div className="w-full relative border border-[#221E20] bg-white flex flex-col sm:flex-row group transition-all duration-300">
            {/* Bookmark Icon */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const next = !bookmarked;
                    if (onToggleBookmark) {
                        onToggleBookmark(id, next);
                        return;
                    }
                    setInternalBookmark(next);
                }}
                className={`absolute top-[15px] right-[10px] z-20 p-1 transition-colors ${bookmarked ? 'text-[#cc0000]' : 'text-[#221E20] hover:text-[#cc0000]'
                    }`}
                aria-label="В закладки"
            >
                <FaBookmark size={20} />
            </button>

            {/* Clickable Area */}
            <Link href={`/shop/${id}`} className="contents">
                {/* Image Section */}
                <div className="relative w-full sm:w-[225px] h-[315px] sm:h-[315px] shrink-0 bg-gray-100 border-b sm:border-b-0 sm:border-r border-[#221E20]">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#221E20]/20 font-serif text-4xl">
                            COVER
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="flex-1 p-5 sm:pl-[20px] sm:pt-[20px] sm:pr-[40px] flex flex-col relative">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-[11px] px-2 py-1 border border-[#221E20]/15 rounded-full uppercase tracking-wider">
                            {categoryLabel}
                        </span>
                        <span className="text-[11px] px-2 py-1 bg-[#F2D2C3] rounded-full uppercase tracking-wider">
                            {fulfillmentLabel}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif font-bold text-xl leading-tight mb-[20px] max-w-[420px] text-[#221E20] group-hover:opacity-70 transition-opacity">
                        {title}
                    </h3>

                    {/* Description */}
                    <p className="font-serif text-[15px] leading-relaxed opacity-80 max-w-[480px] text-[#221E20] line-clamp-4">
                        {description}
                    </p>

                    {/* Actions / Price */}
                    <div className="mt-auto pt-[40px] sm:pt-[70px] flex items-center justify-between gap-3">
                        {onAddToCart ? (
                            <button
                                type="button"
                                className="text-[12px] px-3 py-1.5 border border-[#221E20]/20 rounded hover:border-[#221E20] transition-colors"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onAddToCart(id);
                                }}
                            >
                                В корзину
                            </button>
                        ) : <span />}
                        <div className="bg-[#F2D2C3] rounded-[4px] px-[8px] py-[4px] h-[25px] max-w-[100px] flex items-center justify-center">
                            <span className="font-serif font-bold text-[13px] text-[#221E20] leading-none">
                                {price} ₽
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
