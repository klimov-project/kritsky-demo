'use client';

import React from 'react';
import AdminModal from './index';
import Button from '@/components/shared/Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Подтвердить',
    cancelLabel = 'Отмена',
    variant = 'danger'
}: ConfirmationModalProps) {
    const footer = (
        <>
            <Button variant="outlined" onClick={onClose}>{cancelLabel}</Button>
            <Button
                variant="outlined"
                className={variant === 'danger' ? 'text-red-600 border-red-200 hover:bg-red-50' : variant === 'warning' ? 'text-orange-500 border-orange-200 hover:bg-orange-50' : ''}
                onClick={() => { onConfirm(); onClose(); }}
            >
                {confirmLabel}
            </Button>
        </>
    );

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="small">
            <p className="text-gray-600 font-serif leading-relaxed">
                {message}
            </p>
        </AdminModal>
    );
}
