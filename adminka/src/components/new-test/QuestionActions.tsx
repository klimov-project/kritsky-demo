import {
    IoArrowBackOutline,
    IoEyeOffOutline,
    IoEyeOutline,
    IoLockClosedOutline,
    IoRefreshOutline,
} from 'react-icons/io5';
import type { QuestionActionsProps } from '@/types/ui/newTestPage';
import styles from './QuestionActions.module.scss';

export default function QuestionActions({
    onRefresh,
    onBack,
    disableBack,
    disableRefresh = false,
    isRefreshing = false,
    isCollapsed = false,
    onToggleCollapse,
    children,
    isLocked,
}: QuestionActionsProps) {
    return (
        <div className={`no-print ${styles.actions}`}>
            <button
                type="button"
                className={styles.iconButton}
                onClick={onBack}
                aria-label="Вернуть предыдущий вариант задания"
                title="Назад"
                disabled={disableBack}
            >
                <IoArrowBackOutline />
            </button>
            <button
                type="button"
                className={styles.iconButton}
                onClick={onRefresh}
                aria-label="Новый вариант задания"
                title="Новый вариант задания"
                disabled={disableRefresh || isRefreshing}
            >
                {isRefreshing ? (
                    <IoRefreshOutline className="animate-spin" />
                ) : (
                    <>
                        {isLocked && <IoLockClosedOutline className="text-[10px] opacity-60" />}
                        <IoRefreshOutline />
                    </>
                )}
            </button>
            {children}
            <button
                type="button"
                className={`${styles.iconButton} ${isCollapsed ? styles.iconButtonActive : ''}`}
                onClick={onToggleCollapse}
                aria-label={isCollapsed ? 'Показать задание' : 'Скрыть задание'}
                title={isCollapsed ? 'Показать' : 'Скрыть'}
            >
                {isCollapsed ? <IoEyeOffOutline /> : <IoEyeOutline />}
            </button>
        </div>
    );
}
