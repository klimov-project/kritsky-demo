'use client';

import type { ButtonHTMLAttributes } from 'react';
import React from 'react';

import styles from './ProfileActionButton.module.scss';

type ProfileActionButtonVariant = 'muted' | 'accent' | 'outline';
type ProfileActionButtonSize = 'default' | 'small';

interface ProfileActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ProfileActionButtonVariant;
    size?: ProfileActionButtonSize;
    fullWidth?: boolean;
}

export default function ProfileActionButton({
    variant = 'muted',
    size = 'default',
    fullWidth = false,
    className = '',
    type = 'button',
    ...props
}: ProfileActionButtonProps) {
    const buttonClassName = [
        styles.button,
        styles[`button--${variant}`],
        styles[`button--${size}`],
        fullWidth ? styles['button--full'] : '',
        className,
    ].join(' ').trim();

    return <button type={type} className={buttonClassName} {...props} />;
}

