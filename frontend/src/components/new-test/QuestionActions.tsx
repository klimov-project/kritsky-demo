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
        <div className="no-print flex items-center md:flex-col lg:flex-row gap-1 pt-0.5 md:w-0 md:shrink-0 md:-translate-x-16 md:-mr-4 flex-wrap">
            <button
                type="button"
                className="p-1 border border-gray-300 rounded text-base disabled:opacity-40 bg-white flex items-center justify-center gap-0.5"
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
                className="p-1 border border-gray-300 rounded text-base disabled:opacity-40 bg-white"
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
                    className={`p-1 border border-gray-300 rounded text-base bg-white transition-colors ${isAnswerChecked ? 'text-blue-600 border-blue-600' : ''}`}
                    onClick={onCheck}
                    aria-label={isAnswerChecked ? 'Скрыть ответ' : 'Показать ответ'}
                    title={isAnswerChecked ? 'Скрыть ответ' : 'Показать ответ'}
                >
                    {isAnswerChecked ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </button>
            )}
            <button
                type="button"
                className="p-1 border border-gray-300 rounded text-base bg-white"
                onClick={onToggleCollapse}
                aria-label={isCollapsed ? 'Развернуть задание' : 'Свернуть задание'}
                title={isCollapsed ? 'Развернуть задание' : 'Свернуть задание'}
            >
                {isCollapsed ? <IoChevronDownOutline /> : <IoChevronUpOutline />}
            </button>
        </div>
    );
}
