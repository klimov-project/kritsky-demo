'use client';

import React, { useEffect, useState } from 'react';
import { IoIosArrowUp } from 'react-icons/io';

export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <button
            type="button"
            aria-label="Наверх"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed right-4 bottom-5 md:right-6 md:bottom-8 z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-lg border transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0 pointer-events-auto bg-[#221E20] text-white border-[#221E20]' : 'opacity-0 translate-y-2 pointer-events-none bg-[#221E20] text-white border-[#221E20]'} hover:bg-white hover:text-[#221E20] hover:border-[#221E20]`}
        >
            <IoIosArrowUp size={24} />
        </button>
    );
}
