import {
    IoArrowBackOutline,
    IoChevronDownOutline,
    IoChevronUpOutline,
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
    onCheck,
    isAnswerChecked,
}: QuestionActionsProps) {
    return (
        <div className={`no-print ${styles.actions}`}>
            <button
                type="button"
                className={styles.iconButton}
                onClick={onRefresh}
                aria-label="Обновить вопрос"
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
            <button
                type="button"
                className={styles.iconButton}
                onClick={onBack}
                aria-label="Вернуть предыдущий вариант"
                disabled={disableBack}
            >
                <IoArrowBackOutline />
            </button>
            {children}
            {onCheck && (
                <button
                    type="button"
                    className={`${styles.iconButton} ${isAnswerChecked ? styles.iconButtonActive : ''}`}
                    onClick={onCheck}
                    aria-label={isAnswerChecked ? 'Скрыть ответ' : 'Показать ответ'}
                    title={isAnswerChecked ? 'Скрыть ответ' : 'Показать ответ'}
                >
                    {isAnswerChecked ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </button>
            )}
            <button
                type="button"
                className={styles.iconButton}
                onClick={onToggleCollapse}
                aria-label={isCollapsed ? 'Развернуть задание' : 'Свернуть задание'}
                title={isCollapsed ? 'Развернуть задание' : 'Свернуть задание'}
            >
                {isCollapsed ? <IoChevronDownOutline /> : <IoChevronUpOutline />}
            </button>
        </div>
    );
}
