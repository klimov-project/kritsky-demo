import type { ReactNode } from 'react';
import {
    IoArrowBackOutline,
    IoEyeOffOutline,
    IoEyeOutline,
    IoLockClosedOutline,
    IoRefreshOutline,
} from 'react-icons/io5';
import QuestionNumberBadge from '@/components/new-test/QuestionNumberBadge';
import styles from './VariantTaskCard.module.scss';

interface VariantTaskCardProps {
    label: string;
    children: ReactNode;
    onRefresh: () => void;
    onBack: () => void;
    disableBack: boolean;
    disableRefresh?: boolean;
    isRefreshing?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    isLocked?: boolean;
    actionSlot?: ReactNode;
}

export default function VariantTaskCard({
    label,
    children,
    onRefresh,
    onBack,
    disableBack,
    disableRefresh = false,
    isRefreshing = false,
    isCollapsed = false,
    onToggleCollapse,
    isLocked = false,
    actionSlot,
}: VariantTaskCardProps) {
    return (
        <div className={styles.root}>
            <article className={styles.card}>
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
                    {actionSlot}
                </div>

                <button
                    type="button"
                    className={`no-print ${styles.visibilityButton} ${isCollapsed ? styles.visibilityButtonActive : ''}`}
                    onClick={onToggleCollapse}
                    aria-label={isCollapsed ? 'Показать задание' : 'Скрыть задание'}
                    title={isCollapsed ? 'Показать' : 'Скрыть'}
                >
                    {isCollapsed ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </button>

                <div className={`${styles.content} ${isCollapsed ? 'hidden print:flex' : ''}`}>
                    <QuestionNumberBadge label={label} />
                    <div className={styles.body}>
                        {children}
                    </div>
                </div>
            </article>
        </div>
    );
}
