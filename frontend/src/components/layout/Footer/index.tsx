'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { FaTelegram } from 'react-icons/fa6';
import { SiYoutubemusic } from 'react-icons/si';
import { RiVkFill } from 'react-icons/ri';
import FeedbackPopup from '@/components/shared/FeedbackPopup';

export default function Footer() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const resetPopup = () => {
        setIsPopupOpen(false);
    };

    return (
        <>
            <footer className="w-full relative bg-white border-t border-[#E5E5E5] min-h-[220px]">
                <div className="mx-auto max-w-[1440px] px-4 md:px-[48px] py-[40px] flex flex-col h-full text-[#221E20] font-serif">
                    <div className="flex flex-col lg:flex-row lg:justify-between gap-12 lg:gap-8">
                        <div className="flex flex-col gap-[15px]">
                            <div className="flex flex-wrap gap-6 lg:gap-[48px] text-[16px]">
                                <Link href="/about" className="nav-link-animated">
                                    О проекте
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setIsPopupOpen(true)}
                                    className="nav-link-animated text-left cursor-pointer"
                                >
                                    Обратная связь
                                </button>
                            </div>

                            <div className="flex items-center gap-[5px]">
                                <a href="#" className="p-1 hover:opacity-70 transition-opacity" aria-label="Telegram">
                                    <FaTelegram size={24} />
                                </a>
                                <a href="#" className="p-1 hover:opacity-70 transition-opacity" aria-label="YouTube Music">
                                    <SiYoutubemusic size={24} />
                                </a>
                                <a href="#" className="p-1 hover:opacity-70 transition-opacity" aria-label="VK">
                                    <RiVkFill size={24} />
                                </a>
                            </div>
                        </div>

                        <div className="text-[12px] opacity-60 flex flex-col gap-1 lg:text-right max-w-[410px]">
                            <p className="font-bold mb-1 opacity-100 uppercase">ИП КРИЦКИЙ РОМАН ДМИТРИЕВИЧ</p>
                            <p>ИНН: 772796119977</p>
                            <p>ОГРНИП: 325774600403322</p>
                        </div>
                    </div>

                    <div className="mt-[60px] flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-[48px] text-[14px] opacity-60">
                        <span className="whitespace-nowrap">ⓒ Крицкий 2025. Все права защищены</span>

                        <div className="flex flex-wrap gap-x-5 lg:gap-x-[48px] gap-y-3">
                            <Link href="/terms" className="hover:underline">Пользовательское соглашение</Link>
                            <Link href="/privacy" className="hover:underline">Политика конфиденциальности</Link>
                            <Link href="/rules" className="hover:underline">Правила</Link>
                        </div>
                    </div>
                </div>
            </footer>

            <FeedbackPopup
                isOpen={isPopupOpen}
                onClose={resetPopup}
            />
        </>
    );
}
