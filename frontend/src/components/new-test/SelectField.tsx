import type { SelectFieldProps } from '@/types/ui/newTestPage';
import styles from './SelectField.module.scss';

export default function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
}: SelectFieldProps) {
    return (
        <label className={styles.root}>
            <span className={styles.label}>{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={styles.select}
            >
                <option value="">{placeholder || 'Выбрать'}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
