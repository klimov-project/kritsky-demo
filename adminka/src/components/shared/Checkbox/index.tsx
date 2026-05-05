'use client';

import React, { forwardRef, InputHTMLAttributes, useId } from 'react';
import styles from './Checkbox.module.scss';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    autoCheck?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({
        label,
        autoCheck = true,
        className = '',
        checked,
        onChange,
        id,
        ...props
    }, ref) => {
        const generatedId = useId();
        const checkboxId = id || `checkbox-${generatedId.replace(/:/g, '')}`;

        return (
            <div className={`${styles.checkboxWrapper} ${className}`}>
                <input
                    ref={ref}
                    type="checkbox"
                    id={checkboxId}
                    className={styles.checkbox}
                    checked={checked}
                    onChange={autoCheck ? onChange : undefined}
                    {...props}
                />
                <label htmlFor={checkboxId} className={styles.checkboxLabel}>
                    <span className={styles.checkboxCustom}>
                        <svg
                            className={styles.checkIcon}
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M20 6L9 17L4 12"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    {label && <span className={styles.labelText}>{label}</span>}
                </label>
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
