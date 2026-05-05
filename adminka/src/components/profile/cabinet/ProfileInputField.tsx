'use client';

import type { ChangeEventHandler, InputHTMLAttributes } from 'react';
import React from 'react';

import styles from './ProfileInputField.module.scss';

interface ProfileInputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label: string;
    onChange?: ChangeEventHandler<HTMLInputElement>;
}

export default function ProfileInputField({ label, className = '', onChange, ...props }: ProfileInputFieldProps) {
    return (
        <label className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <input className={[styles.input, className].join(' ').trim()} onChange={onChange} {...props} />
        </label>
    );
}

