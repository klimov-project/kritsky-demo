import type { DockButtonProps } from '@/types/ui/newTestPage';
import styles from './DockButton.module.scss';

export default function DockButton({
    children,
    onClick,
    disabled,
    fullWidth = false,
}: DockButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={styles.button}
            style={fullWidth ? undefined : { width: 'auto' }}
        >
            {children}
        </button>
    );
}
