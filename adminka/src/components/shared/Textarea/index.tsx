'use client';

import React, { forwardRef, TextareaHTMLAttributes } from 'react';
import styles from './Textarea.module.scss';

type TextareaState = 'regular' | 'error' | 'success' | 'warning';
type TextareaWidth = 'full' | 'medium' | 'small';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    state?: TextareaState;
    width?: TextareaWidth;
    helperText?: string;
    label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({
        state = 'regular',
        width = 'medium',
        helperText,
        label,
        className = '',
        ...props
    }, ref) => {
        const textareaClasses = `
            ${styles.textarea}
            ${styles[`textarea--${state}`]}
            ${styles[`textarea--${width}`]}
            ${className}
        `.trim();

        return (
            <div className={styles.textareaWrapper}>
                {label && <label className={styles.label}>{label}</label>}
                <textarea ref={ref} className={textareaClasses} {...props} />
                {helperText && (
                    <span className={`${styles.helperText} ${styles[`helperText--${state}`]}`}>
                        {helperText}
                    </span>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

export default Textarea;
