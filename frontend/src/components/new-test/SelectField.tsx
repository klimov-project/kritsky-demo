import type { SelectFieldProps } from '@/types/ui/newTestPage';

export default function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
}: SelectFieldProps) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
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
