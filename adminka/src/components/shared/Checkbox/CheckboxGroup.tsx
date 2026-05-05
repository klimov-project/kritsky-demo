'use client';

import React, { useState, useCallback } from 'react';
import Checkbox from '@/components/shared/Checkbox';
import Button from '@/components/shared/Button';
import styles from './Checkbox.module.scss';

export interface CheckboxOption {
    value: string;
    label: string;
    disabled?: boolean;
    defaultChecked?: boolean;
}

export interface CheckboxGroupProps {
    options: CheckboxOption[];
    onChange?: (selectedValues: string[]) => void;
    showSelectAll?: boolean;
    selectAllLabel?: string;
    deselectAllLabel?: string;
    className?: string;
    name?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
    options,
    onChange,
    showSelectAll = false,
    selectAllLabel = 'Выбрать все',
    deselectAllLabel = 'Снять все',
    className = '',
    name = 'checkbox-group',
}) => {
    const [checkedValues, setCheckedValues] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        options.forEach(option => {
            if (option.defaultChecked) {
                initial.add(option.value);
            }
        });
        return initial;
    });

    const handleCheckboxChange = useCallback((value: string, checked: boolean) => {
        setCheckedValues(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(value);
            } else {
                newSet.delete(value);
            }

            if (onChange) {
                onChange(Array.from(newSet));
            }

            return newSet;
        });
    }, [onChange]);

    const handleSelectAll = useCallback(() => {
        const allValues = options
            .filter(opt => !opt.disabled)
            .map(opt => opt.value);

        setCheckedValues(new Set(allValues));

        if (onChange) {
            onChange(allValues);
        }
    }, [options, onChange]);

    const handleDeselectAll = useCallback(() => {
        setCheckedValues(new Set());

        if (onChange) {
            onChange([]);
        }
    }, [onChange]);

    const allChecked = options.every(opt =>
        opt.disabled || checkedValues.has(opt.value)
    );

    return (
        <div className={`${styles.checkboxGroup} ${className}`}>
            {showSelectAll && (
                <div className={styles.selectAllButtons}>
                    <Button
                        variant="filled"
                        fontSize={14}
                        paddingY={6}
                        paddingX={12}
                        onClick={allChecked ? handleDeselectAll : handleSelectAll}
                    >
                        {allChecked ? deselectAllLabel : selectAllLabel}
                    </Button>
                </div>
            )}

            <div className={styles.checkboxList}>
                {options.map((option) => (
                    <Checkbox
                        key={option.value}
                        id={`${name}-${option.value}`}
                        label={option.label}
                        checked={checkedValues.has(option.value)}
                        disabled={option.disabled}
                        onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                    />
                ))}
            </div>
        </div>
    );
};

export default CheckboxGroup;
