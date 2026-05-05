'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { IconType } from 'react-icons';
import styles from './BrandButton.module.scss';

export type BrandButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent';
export type BrandButtonSize = 'md' | 'lg' | 'xl';

interface BrandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: BrandButtonVariant;
    size?: BrandButtonSize;
    leftIcon?: IconType;
    rightIcon?: IconType;
    caps?: boolean;
    fullWidth?: boolean;
}

const BrandButton = forwardRef<HTMLButtonElement, BrandButtonProps>(
    ({
        variant = 'primary',
        size = 'md',
        leftIcon: LeftIcon,
        rightIcon: RightIcon,
        caps = false,
        fullWidth = false,
        className = '',
        children,
        ...props
    }, ref) => {
        const classes = [
            styles.button,
            styles[`button--${variant}`],
            styles[`button--${size}`],
            caps ? styles['button--caps'] : '',
            fullWidth ? styles['button--full'] : '',
            className,
        ].filter(Boolean).join(' ');

        return (
            <button ref={ref} className={classes} {...props}>
                {LeftIcon ? <LeftIcon size={18} className={styles.icon} /> : null}
                <span>{children}</span>
                {RightIcon ? <RightIcon size={18} className={styles.icon} /> : null}
            </button>
        );
    }
);

BrandButton.displayName = 'BrandButton';

export default BrandButton;
