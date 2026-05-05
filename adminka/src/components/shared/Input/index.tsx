'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';
import styles from './Input.module.scss';

export type InputState = 'regular' | 'error' | 'success' | 'warning';
export type InputWidth = 'full' | 'medium' | 'small';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    state?: InputState;
    width?: InputWidth;
    helperText?: string;
    label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({
        state = 'regular',
        width = 'medium',
        helperText,
        label,
        className = '',
        ...props
    }, ref) => {
        const inputClasses = `
            ${styles.input}
            ${styles[`input--${state}`]}
            ${styles[`input--${width}`]}
            ${className}
        `.trim();

        return (
            <div className={styles.inputWrapper}>
                {label && (
                    <label className={styles.label}>
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={inputClasses}
                    {...props}
                />
                {helperText && (
                    <span className={`${styles.helperText} ${styles[`helperText--${state}`]}`}>
                        {helperText}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
