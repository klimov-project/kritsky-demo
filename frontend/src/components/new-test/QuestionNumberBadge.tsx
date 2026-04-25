import type { QuestionNumberBadgeProps } from '@/types/ui/newTestPage';
import styles from './QuestionNumberBadge.module.scss';

export default function QuestionNumberBadge({ label }: QuestionNumberBadgeProps) {
    return (
        <span className={styles.badge}>
            {label}
        </span>
    );
}
