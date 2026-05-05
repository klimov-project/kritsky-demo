'use client';

import React, { forwardRef, InputHTMLAttributes, useId } from 'react';
import styles from './RadioButton.module.scss';

export interface RadioButtonProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
}

const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(
    ({
        label,
        className = '',
        id,
        ...props
    }, ref) => {
        const generatedId = useId();
        const radioId = id || `radio-${generatedId.replace(/:/g, '')}`;

        return (
            <div className={`${styles.radioWrapper} ${className}`}>
                <input
                    ref={ref}
                    type="radio"
                    id={radioId}
                    className={styles.radio}
                    {...props}
                />
                <label htmlFor={radioId} className={styles.radioLabel}>
                    <span className={styles.radioCustom}>
                        <span className={styles.radioInner}></span>
                    </span>
                    {label && <span className={styles.labelText}>{label}</span>}
                </label>
            </div>
        );
    }
);

RadioButton.displayName = 'RadioButton';

export default RadioButton;
