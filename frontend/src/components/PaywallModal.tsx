'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/components/shared/Button';
import { IoCloseOutline } from 'react-icons/io5';

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
    isAuthenticated: boolean;
    message?: string;
}

export function PaywallModal({ isOpen, onClose, isAuthenticated, message }: PaywallModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 no-print">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" style={{ animation: 'sceneFadeIn 0.35s ease-out forwards' }}>
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                    aria-label="Закрыть"
                >
                    <IoCloseOutline size={24} />
                </button>
                
                <h3 className="text-xl font-bold mb-3 pr-8">Ограниченный доступ</h3>
                
                <p className="text-sm opacity-80 mb-6 leading-relaxed">
                    {message || 'Вы достигли лимита бесплатных действий, или пытаетесь использовать функцию, доступную только по подписке. Оформите подписку, чтобы получить полный доступ ко всем материалам и неограниченной генерации вариантов.'}
                </p>

                <div className="flex flex-col gap-3">
                    {isAuthenticated ? (
                        <Link href="/profile" className="w-full">
                            <Button className="w-full flex justify-center">Оформить подписку</Button>
                        </Link>
                    ) : (
                        <Link href="/?modal=register" className="w-full">
                            <Button className="w-full flex justify-center">Зарегистрироваться</Button>
                        </Link>
                    )}
                    <Button onClick={onClose} className="w-full bg-[#f3f4f6] text-black hover:bg-[#e5e7eb] border-none flex justify-center">
                        Позже
                    </Button>
                </div>
            </div>
        </div>
    );
}
