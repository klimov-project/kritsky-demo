'use client';

import React, { useEffect } from 'react';
import { IoIosClose } from 'react-icons/io';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
}

export default function AdminModal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'medium'
}: AdminModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        small: 'max-w-md',
        medium: 'max-w-2xl',
        large: 'max-w-4xl'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200`}>
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold font-serif">{title}</h2>
                    <button onClick={onClose} className="text-3xl hover:opacity-60 transition-opacity p-1">
                        <IoIosClose />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 py-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
