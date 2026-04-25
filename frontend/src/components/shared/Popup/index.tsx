'use client';

import React, { useEffect } from 'react';
import { IoIosClose } from 'react-icons/io';

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
}

export default function Popup({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'medium',
}: PopupProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        small: 'max-w-md',
        medium: 'max-w-xl',
        large: 'max-w-3xl',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/45" onClick={onClose} />
            <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl overflow-hidden`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#221E20]/10">
                    {title ? <h2 className="font-serif text-2xl font-bold">{title}</h2> : <div />}
                    <button type="button" onClick={onClose} className="text-3xl hover:opacity-60 transition-opacity">
                        <IoIosClose />
                    </button>
                </div>

                <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
                    {children}
                </div>

                {footer && (
                    <div className="px-6 py-4 border-t border-[#221E20]/10 bg-[#FAF8F7]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
