'use client';

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

export type ButtonVariant = 'outlined' | 'filled';
export type ButtonState = 'default' | 'hover' | 'focus' | 'active' | 'disabled';
export type ButtonSize = 'small' | 'default';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    fontSize?: number | string;
    fontWeight?: 400 | 700 | 'normal' | 'bold';
    paddingY?: number | string;
    paddingX?: number | string;
    fullWidth?: boolean;
    size?: ButtonSize;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        variant = 'outlined',
        fontSize,
        fontWeight,
        paddingY,
        paddingX,
        fullWidth = false,
        size = 'small',
        className = '',
        children,
        disabled = false,
        style,
        ...props
    }, ref) => {
        const buttonClasses = `
            ${styles.button}
            ${styles[`button--${variant}`]}
            ${styles[`button--size-${size}`]}
            ${fullWidth ? styles['button--full'] : ''}
            ${disabled ? styles['button--disabled'] : ''}
            ${className}
        `.trim();

        const customStyles: React.CSSProperties = {
            ...style,
            ...(fontSize && { fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize }),
            ...(fontWeight && { fontWeight }),
            ...(paddingY && {
                paddingTop: typeof paddingY === 'number' ? `${paddingY}px` : paddingY,
                paddingBottom: typeof paddingY === 'number' ? `${paddingY}px` : paddingY,
            }),
            ...(paddingX && {
                paddingLeft: typeof paddingX === 'number' ? `${paddingX}px` : paddingX,
                paddingRight: typeof paddingX === 'number' ? `${paddingX}px` : paddingX,
            }),
        };

        return (
            <button
                ref={ref}
                className={buttonClasses}
                style={customStyles}
                disabled={disabled}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
