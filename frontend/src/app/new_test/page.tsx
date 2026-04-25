'use client';

import PageLayout from '@/components/layout/PageLayout';
import Button from '@/components/shared/Button';
import Checkbox from '@/components/shared/Checkbox';
import FeedbackPopup from '@/components/shared/FeedbackPopup';
import Popup from '@/components/shared/Popup';
import AdminIdBadge from '@/components/new-test/AdminIdBadge';
import AdminTaskMeta from '@/components/new-test/AdminTaskMeta';
import CollapsibleInstruction from '@/components/new-test/CollapsibleInstruction';
import NewTestActionDock from '@/components/new-test/NewTestActionDock';
import NewTestAgeModal from '@/components/new-test/NewTestAgeModal';
import NewTestBlockedOverlay from '@/components/new-test/NewTestBlockedOverlay';
import NewTestGlobalStyles from '@/components/new-test/NewTestGlobalStyles';
import NewTestLoadingOverlay from '@/components/new-test/NewTestLoadingOverlay';
import NewTestTaskSelectPopup from '@/components/new-test/NewTestTaskSelectPopup';
import QuestionActions from '@/components/new-test/QuestionActions';
import QuestionNumberBadge from '@/components/new-test/QuestionNumberBadge';
import RichTextBlock from '@/components/new-test/RichTextBlock';
import SelectField from '@/components/new-test/SelectField';
import TestVariantSkeleton from '@/components/new-test/TestVariantSkeleton';
import {
    IoPersonOutline,
    IoRefreshOutline,
    IoLockClosedOutline,
    IoPin,
    IoCloseOutline,
    IoDocumentTextOutline,
} from 'react-icons/io5';
import { PaywallModal } from '@/components/PaywallModal';
import type { Task1Filters } from '@/types/testVariant';
import type { RuntimeVariantTaskKey } from '@/lib/variantsApi';
import { RUSSIAN_LETTERS, TASK8_MAX_OPTIONS } from '@/consts/newTest';
import {
    getTask2AnswerMap,
    getTask2RightOptions,
    getTask8CorrectOptionNumbers,
} from '@/utils/newTest';
import { getExcerptChapters, getTextColumnsCount } from '@/utils/newTestPage';
import { useNewTestPage } from '@/hooks/useNewTestPage';
import styles from './NewTestPage.module.scss';

export default function TestPage() {
    const page = useNewTestPage();

    const {
        user, isAuthenticated, isAdmin, isPro,
        works, poets, knowledgeBaseSettings,
        isKnowledgeBaseLoading, knowledgeBaseError,
        selectedWorkId, setSelectedWorkId,
        selectedExcerptId, setSelectedExcerptId,
        selectedPoetId, setSelectedPoetId,
        selectedPoemId, setSelectedPoemId,
        selectedThemeId, setSelectedThemeId,
        selectedChapter, setSelectedChapter,
        selectedWork, selectedExcerpt, selectedPoet, selectedPoem,
        selectedWorkExcerpts, excerptDropdownOptions,
        availablePoets, availablePoems, allThemes,
        task1Filters, setTask1Filters,
        variant, setVariant,
        animationKey,
        showAgeModal, setShowAgeModal, setPendingVariant,
        showLimitModal, setShowLimitModal, limitModalMessage,
        showFeedbackModal, setShowFeedbackModal,
        showPaywall, setShowPaywall, paywallMessage,
        selectModal, setSelectModal,
        checkedAnswers, statusMessage, exportQuota,
        isMobileDockOpen, setIsMobileDockOpen,
        isDownloadingPdf, dockLiftOffset,
        variantGenerationMode,
        refreshLoadingByBlock, refreshLoadingByTask, refreshDisabledByTask,
        isSavingVariant, collapsedTasks,
        isSettingWeeklyVariant, weeklyPins,
        sceneNavigation, poemNavigation,
        shouldShowVariantSkeleton,
        isAnyTaskRefreshing, isBusyWithFullOperations,
        loadingOverlayMessage, showAnswers,
        toggleTaskCollapse,
        handleConfirmAge,
        toggleTaskAnswer, handleCheckYourself,
        canGoBackTask, handleGoBackTask,
        navigateScene, navigatePoem,
        generateVariant,
        refreshTask, refreshTask2Properties,
        refreshBlock1, refreshBlock2, refreshBlock3,
        getQuotaCaption, handlePrint, handleDownload,
        handleSetWeeklyVariant,
        getPinConflict, handlePinTask, handleUnpinTask, handleClearAllPins,
        openSelectModal, closeSelectModal, handleConfirmSelect,
        handleSaveVariant,
        openFeedbackModal, handleSendFeedback,
        openPaywall,
    } = page;

    const task2Pairs = variant?.task2?.pairs || [];
    const task2RightOptions = getTask2RightOptions(variant?.task2 || null);
    const task2Columns = Math.max(1, task2Pairs.length || 3);

    return (
        <PageLayout bodyClassName="test-variant-page test-page-with-bg">
            <NewTestGlobalStyles />

            {user?.isBlocked && (
                <NewTestBlockedOverlay
                    supportEmail={process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'admin@kritsky.local'}
                />
            )}

            <NewTestAgeModal
                isOpen={showAgeModal}
                onCancel={() => {
                    setShowAgeModal(false);
                    setPendingVariant(null);
                }}
                onConfirm={handleConfirmAge}
            />

            <Popup
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                title="Лимит на сегодня исчерпан"
                size="small"
                footer={(
                    <div className="flex justify-end">
                        <Button variant="outlined" onClick={() => setShowLimitModal(false)}>
                            Понятно
                        </Button>
                    </div>
                )}
            >
                <div className="space-y-2 text-sm">
                    <p>{limitModalMessage || 'Скачивание или печать сейчас недоступны.'}</p>
                    <p className="opacity-70">{getQuotaCaption(exportQuota)}</p>
                </div>
            </Popup>

            <PaywallModal
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
                isAuthenticated={isAuthenticated}
                message={paywallMessage}
            />

            <FeedbackPopup
                isOpen={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
                defaultName={user?.name || ''}
                defaultEmail={user?.email || ''}
                onSubmit={handleSendFeedback}
            />

            <NewTestTaskSelectPopup
                modal={selectModal}
                setModal={setSelectModal}
                onClose={closeSelectModal}
                onConfirm={handleConfirmSelect}
            />

            <NewTestLoadingOverlay
                isVisible={Boolean(variant && isBusyWithFullOperations)}
                message={loadingOverlayMessage}
            />

            <div className={styles.pageContainer}>
                <div className={`print-area test-content-surface min-w-0 variant-uniform ${styles.surface}`}>
                    {shouldShowVariantSkeleton && (
                        <TestVariantSkeleton />
                    )}

                    {!isKnowledgeBaseLoading && knowledgeBaseError && (
                        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm">
                            <div>{knowledgeBaseError}</div>
                            <Button variant="outlined" onClick={() => window.location.reload()}>
                                Повторить загрузку
                            </Button>
                        </div>
                    )}

                    {!isKnowledgeBaseLoading && !knowledgeBaseError && (!works.length || !poets.length) && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm">
                            База знаний в БД пока пуста. Добавьте материалы в разделе `/admin/materials` и сохраните их в БД.
                        </div>
                    )}

                    {!isKnowledgeBaseLoading && !knowledgeBaseError && works.length > 0 && poets.length > 0 && variant && (
                        <div className="space-y-8 scene-animate" key={animationKey}>
                            <div className={styles.variantHeader}>
                                <div className={styles.folderBar}>
                                    <span className={styles.folderTitle}>Название папки</span>
                                    <button type="button" className={styles.folderClose} aria-label="Закрыть папку">
                                        <IoCloseOutline size={20} />
                                    </button>
                                </div>

                                <div className={styles.modeTabs}>
                                    <div className={`${styles.modeTab} ${styles.modeTabActive}`}>Весь вариант</div>
                                    <div className={styles.modeTab}>Только отрывок</div>
                                    <div className={styles.modeTab}>Только стих.</div>
                                </div>

                                <div className={`${styles.topGrid} no-print`}>
                                    <div className={styles.leftCards}>
                                        <div className={`${styles.leftCard} ${styles.leftCardMain}`}>Вариант 1</div>
                                        <div className={`${styles.leftCard} ${styles.leftCardSub}`}>Часть 1</div>
                                    </div>

                                    <div className={styles.filtersWrap}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <SelectField
                                                label="Произведение"
                                                value={selectedWorkId}
                                                onChange={(value) => {
                                                    setSelectedWorkId(value);
                                                    setSelectedExcerptId('');
                                                    setSelectedChapter('');
                                                }}
                                                options={works.map((work) => ({ value: work.id, label: `${work.author} — ${work.title}` }))}
                                                placeholder="Выберите произведение"
                                            />

                                            {selectedWork && (
                                                <SelectField
                                                    label="Глава"
                                                    value={selectedChapter}
                                                    onChange={(val) => {
                                                        setSelectedChapter(val);
                                                        setSelectedExcerptId('');
                                                    }}
                                                    options={getExcerptChapters(selectedWork).map((ch, i) => ({ value: ch, label: `${i + 1}. ${ch}` }))}
                                                    placeholder="Все главы"
                                                />
                                            )}

                                            <div className="relative">
                                                <SelectField
                                                    label="Отрывок"
                                                    value={selectedExcerptId}
                                                    onChange={(val) => {
                                                        if (!isPro) openPaywall('Выбор отрывка доступен только по подписке.');
                                                        else setSelectedExcerptId(val);
                                                    }}
                                                    options={excerptDropdownOptions}
                                                    placeholder="Выберите отрывок"
                                                />
                                                {!isPro && (
                                                    <div
                                                        className="absolute inset-0 cursor-pointer z-10 bg-transparent flex items-center justify-end pr-8"
                                                        onClick={() => openPaywall('Выбор отрывка доступен только по подписке.')}
                                                    >
                                                        <IoLockClosedOutline className="text-gray-500 mt-5" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            {user?.role === 'admin' && variant && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={handleSetWeeklyVariant}
                                                    disabled={isSettingWeeklyVariant}
                                                >
                                                    {isSettingWeeklyVariant ? 'Сохранение...' : 'Сделать вариантом недели'}
                                                </Button>
                                            )}
                                            <div className="flex-1" />
                                            <Button
                                                variant="outlined"
                                                onClick={refreshBlock1}
                                                disabled={isBusyWithFullOperations || isAnyTaskRefreshing || refreshLoadingByBlock.block1}
                                                className="inline-flex items-center gap-2"
                                            >
                                                {refreshLoadingByBlock.block1 && <IoRefreshOutline className="animate-spin" />}
                                                {!user && <IoLockClosedOutline className="opacity-50" />}
                                                Обновить отрывок и задания 1–5
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isAdmin && Object.keys(weeklyPins).length > 0 && (
                                <div className="no-print mb-3 p-2 rounded border border-orange-200 bg-orange-50 text-xs text-orange-800">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-semibold flex items-center gap-1">
                                            <IoPin className="w-3 h-3" />
                                            Закреплённые задания ({Object.keys(weeklyPins).length})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => void handleClearAllPins()}
                                            className="text-orange-600 underline hover:no-underline cursor-pointer"
                                        >
                                            Снять все
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(weeklyPins).map(([key, id]) => (
                                            <span key={key} className="inline-flex items-center gap-0.5 bg-white border border-orange-200 rounded px-1.5 py-0.5">
                                                <span className="font-mono">{key}</span>
                                                <span className="text-orange-400">→</span>
                                                <span className="font-mono">#{id}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleUnpinTask(key)}
                                                    className="ml-0.5 text-orange-400 hover:text-orange-700 cursor-pointer leading-none"
                                                    title="Открепить"
                                                >×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isAdmin && (
                                <div className="no-print mt-2 mb-1 text-xs text-gray-500 flex flex-wrap items-center gap-1">
                                    <span>Произведение: {variant.work.author} — {variant.work.title}</span>
                                    <AdminIdBadge id={variant.work.id} extra={variant.work.authorId ? `author:${variant.work.authorId}` : undefined} />
                                    <span>| Отрывок</span>
                                    <AdminIdBadge id={variant.excerpt.id} />
                                    {variant.excerpt.themeInternalId && (
                                        <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-sans">
                                            тема: {variant.excerpt.themeInternalId}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className={`${styles.introCard} mt-4 mb-8 text-lg leading-relaxed`}>
                                <RichTextBlock
                                    value={knowledgeBaseSettings.variantTexts.part1Intro}
                                    fallback="Инструкция к первой части не задана."
                                    className="rich-content text-lg leading-relaxed text-center"
                                />
                            </div>

                            <div className={`${styles.textCard} space-y-4`}>
                                {getTextColumnsCount(variant.excerpt.textColumns) === 2 && (variant.excerpt.textSecondColumn || '').trim() ? (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <RichTextBlock
                                            value={variant.excerpt.text}
                                            fallback="Текст отрывка будет отображаться здесь."
                                            className="rich-content text-sm leading-relaxed variant-copy"
                                        />
                                        <RichTextBlock
                                            value={variant.excerpt.textSecondColumn}
                                            fallback=""
                                            className="rich-content text-sm leading-relaxed variant-copy"
                                        />
                                    </div>
                                ) : (
                                    <RichTextBlock
                                        value={variant.excerpt.text}
                                        fallback="Текст отрывка будет отображаться здесь."
                                        className="rich-content text-sm leading-relaxed variant-copy"
                                    />
                                )}
                                <div className="flex justify-end">
                                    <div className="text-right space-y-2">
                                        <div className="text-sm font-bold">{variant.work.author} — {variant.work.title}</div>
                                        <div className="no-print flex flex-wrap justify-end gap-2">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => navigateScene('previous')}
                                                disabled={!sceneNavigation.hasPrevious || !isPro || refreshLoadingByBlock.block1}
                                                className="inline-flex items-center gap-1"
                                            >
                                                {refreshLoadingByBlock.block1 ? <IoRefreshOutline className="animate-spin" /> : (!isPro && <IoLockClosedOutline className="mr-1" />)}
                                                Предыдущая сцена
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => navigateScene('next')}
                                                disabled={!sceneNavigation.hasNext || !isPro || refreshLoadingByBlock.block1}
                                                className="inline-flex items-center gap-1"
                                            >
                                                {refreshLoadingByBlock.block1 ? <IoRefreshOutline className="animate-spin" /> : (!isPro && <IoLockClosedOutline className="mr-1" />)}
                                                Следующая сцена
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`print-page-break ${styles.introCard} mt-8 mb-6 text-base leading-relaxed`}>
                                <RichTextBlock
                                    value={knowledgeBaseSettings.variantTexts.part1QuestionsIntro}
                                    fallback="Формулировка перед заданиями 1–3 не задана."
                                    className="rich-content text-base leading-relaxed text-center"
                                />
                            </div>

                            <div className={styles.taskStack}>
                                <div className="flex items-start gap-3">
                                    <QuestionActions
                                        isLocked={!isPro}
                                        onRefresh={() => refreshTask('task1')}
                                        onBack={() => handleGoBackTask('task1')}
                                        disableBack={!canGoBackTask('task1')}
                                        disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task1}
                                        onCheck={() => toggleTaskAnswer('task1')}
                                        isAnswerChecked={checkedAnswers.has('task1')}
                                        isRefreshing={refreshLoadingByTask.task1}
                                        isCollapsed={collapsedTasks.has('task1')}
                                        onToggleCollapse={() => toggleTaskCollapse('task1')}
                                    />
                                    <div className={`flex-1 space-y-2 ${collapsedTasks.has('task1') ? 'hidden print:block' : ''}`}>
                                        <div className="no-print flex flex-wrap gap-4 text-xs">
                                            <Checkbox
                                                checked={task1Filters.includeWorkQuestions}
                                                onChange={(event) => setTask1Filters((prev: Task1Filters) => ({
                                                    ...prev,
                                                    includeWorkQuestions: event.target.checked,
                                                }))}
                                                label="Вопросы о произведении"
                                            />
                                            <Checkbox
                                                checked={task1Filters.includeTermQuestions}
                                                onChange={(event) => setTask1Filters((prev: Task1Filters) => ({
                                                    ...prev,
                                                    includeTermQuestions: event.target.checked,
                                                }))}
                                                label="Вопросы о терминах"
                                            />
                                        </div>
                                        <div className="flex items-start gap-3 variant-copy">
                                            <QuestionNumberBadge label="1." />
                                            <div className="flex-1">
                                                <RichTextBlock
                                                    value={variant.task1?.text}
                                                    fallback="Вопрос не задан"
                                                    className="text-sm"
                                                />
                                                {isAdmin && <AdminTaskMeta task={variant.task1} taskKey="task1" pinned={weeklyPins['task1'] !== undefined && weeklyPins['task1'] === String(variant.task1?.id ?? '')} pinConflict={getPinConflict('task1', variant.task1)} onPin={() => void handlePinTask('task1', String(variant.task1?.id ?? ''))} onUnpin={() => void handleUnpinTask('task1')} onSelect={() => openSelectModal('task1')} />}
                                            </div>
                                        </div>
                                        <div className="text-sm opacity-60">Ответ: ____________________</div>
                                        {checkedAnswers.has('task1') && (
                                            <div className="text-xs opacity-80">Ответ: {variant.task1?.answer || '—'}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <QuestionActions
                                        isLocked={!isPro}
                                        onRefresh={() => refreshTask('task2')}
                                        onBack={() => handleGoBackTask('task2')}
                                        disableBack={!canGoBackTask('task2')}
                                        disableRefresh={isBusyWithFullOperations || refreshLoadingByTask.task2}
                                        onCheck={() => toggleTaskAnswer('task2')}
                                        isAnswerChecked={checkedAnswers.has('task2')}
                                        isRefreshing={refreshLoadingByTask.task2}
                                        isCollapsed={collapsedTasks.has('task2')}
                                        onToggleCollapse={() => toggleTaskCollapse('task2')}
                                    >
                                        <button
                                            type="button"
                                            className="p-1 border border-gray-300 rounded text-base disabled:opacity-40 bg-white"
                                            onClick={() => refreshTask2Properties()}
                                            aria-label="Обновить персонажей и свойства внутри задания 2"
                                            title="Обновить персонажей и свойства"
                                            disabled={isBusyWithFullOperations || refreshLoadingByTask.task2}
                                        >
                                            <IoPersonOutline />
                                        </button>
                                    </QuestionActions>
                                    <div className={`flex-1 text-sm space-y-3 ${collapsedTasks.has('task2') ? 'hidden print:block' : ''}`}>
                                        <div className="flex items-start gap-3 variant-copy">
                                            <QuestionNumberBadge label="2." />
                                            <div className="flex-1">
                                                <RichTextBlock
                                                    value={variant.task2?.prompt}
                                                    fallback="Вопрос не задан"
                                                    className="text-sm"
                                                />
                                                {isAdmin && <AdminTaskMeta task={variant.task2} taskKey="task2" pinned={weeklyPins['task2'] !== undefined && weeklyPins['task2'] === String(variant.task2?.id ?? '')} pinConflict={getPinConflict('task2', variant.task2)} onPin={() => void handlePinTask('task2', String(variant.task2?.id ?? ''))} onUnpin={() => void handleUnpinTask('task2')} onSelect={() => openSelectModal('task2')} />}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-3">
                                                <div className="text-center text-[28px] leading-none tracking-wide">
                                                    {variant.task2?.leftLabel?.toUpperCase() || 'ПЕРСОНАЖИ'}
                                                </div>
                                                <div className="space-y-1 text-left">
                                                    {task2Pairs.map((pair, index) => (
                                                        <div key={`${pair.id}-${index}`} className="text-sm" style={{ paddingLeft: '1.2em', textIndent: '-1.2em' }}>
                                                            {RUSSIAN_LETTERS[index] || `${index + 1}`}){' '}
                                                            <RichTextBlock value={pair.character} as="span" className="rich-content" />
                                                        </div>
                                                    ))}
                                                    {!task2Pairs.length && <div className="text-sm opacity-60">—</div>}
                                                </div>
                                                <div
                                                    className="new-test-answer-grid w-full max-w-[260px]"
                                                    style={{ '--columns': task2Columns } as React.CSSProperties}
                                                >
                                                    {Array.from({ length: task2Columns }).map((_, index) => (
                                                        <div key={`task2-head-${index}`} className="new-test-answer-cell text-2xl">
                                                            {RUSSIAN_LETTERS[index] || `${index + 1}`}
                                                        </div>
                                                    ))}
                                                    {Array.from({ length: task2Columns }).map((_, index) => (
                                                        <div key={`task2-value-${index}`} className="new-test-answer-cell" />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="text-center text-[28px] leading-none tracking-wide">
                                                    {variant.task2?.rightLabel?.toUpperCase() || 'СВОЙСТВО'}
                                                </div>
                                                <div className="space-y-1 text-left">
                                                    {task2RightOptions.map((option, index) => {
                                                        const optionId = variant?.task2?.shuffledRightOptionIds?.[index] || '';
                                                        return (
                                                            <div key={`${option}-${index}`} className="text-sm" style={{ paddingLeft: '1.2em', textIndent: '-1.2em' }}>
                                                                {index + 1}){' '}
                                                                <RichTextBlock value={option} as="span" className="rich-content" />
                                                                {isAdmin && optionId && (
                                                                    <span
                                                                        className="no-print ml-1 inline-block cursor-pointer rounded bg-gray-100 px-1 font-mono text-[10px] text-gray-500 hover:bg-gray-200"
                                                                        title="Скопировать ID свойства"
                                                                        onClick={() => void navigator.clipboard.writeText(optionId)}
                                                                    >
                                                                        {optionId}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {!task2RightOptions.length && <div className="text-sm opacity-60">—</div>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm opacity-60">Ответ: __________________________________________________________________</div>
                                        {checkedAnswers.has('task2') && (
                                            <div className="text-xs opacity-80">Ответ: {getTask2AnswerMap(variant.task2, RUSSIAN_LETTERS)}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <QuestionActions
                                        isLocked={!isPro}
                                        onRefresh={() => refreshTask('task3')}
                                        onBack={() => handleGoBackTask('task3')}
                                        disableBack={!canGoBackTask('task3')}
                                        disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task3}
                                        isRefreshing={refreshLoadingByTask.task3}
                                        isCollapsed={collapsedTasks.has('task3')}
                                        onToggleCollapse={() => toggleTaskCollapse('task3')}
                                        onCheck={() => toggleTaskAnswer('task3')}
                                        isAnswerChecked={checkedAnswers.has('task3')}
                                    />
                                    <div className={`flex-1 space-y-2 ${collapsedTasks.has('task3') ? 'hidden print:block' : ''}`}>
                                        <div className="flex items-start gap-3 variant-copy">
                                            <QuestionNumberBadge label="3." />
                                            <div className="flex-1">
                                                <div className="text-sm">Заполните пропуски в предложении.</div>
                                                {isAdmin && <AdminTaskMeta task={variant.task3} taskKey="task3" pinned={weeklyPins['task3'] !== undefined && weeklyPins['task3'] === String(variant.task3?.id ?? '')} pinConflict={getPinConflict('task3', variant.task3)} onPin={() => void handlePinTask('task3', String(variant.task3?.id ?? ''))} onUnpin={() => void handleUnpinTask('task3')} onSelect={() => openSelectModal('task3')} />}
                                            </div>
                                        </div>
                                        <div className="text-sm variant-copy">
                                            <RichTextBlock value={variant.task3?.part1} fallback="—" as="span" />
                                            {' '}
                                            <RichTextBlock value={variant.task3?.part2} fallback="—" as="span" />
                                        </div>
                                        <div className="text-sm opacity-60">Ответ: ____________________</div>
                                        {checkedAnswers.has('task3') && (
                                            <div className="text-xs opacity-80">
                                                Ответ: {variant.task3?.answer1 || '—'} / {variant.task3?.answer2 || '—'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={`print-page-break ${styles.introCard} text-base leading-relaxed`}>
                                <RichTextBlock
                                    value={knowledgeBaseSettings.variantTexts.part1Task4Lead}
                                    fallback="Вводная формулировка перед заданиями 4.1 и 4.2 не задана."
                                    className="rich-content text-base leading-relaxed text-center"
                                />
                            </div>

                            <div className="new-test-divider" aria-hidden="true" />

                            <CollapsibleInstruction
                                value={knowledgeBaseSettings.variantTexts.part1Criteria}
                                fallback="Критерии к первой части не заданы."
                            />

                            <div className="space-y-[30px]">
                                <div className="flex items-start gap-3">
                                    <QuestionActions
                                        isLocked={!isPro}
                                        onRefresh={() => refreshTask('task4_1')}
                                        onBack={() => handleGoBackTask('task4_1')}
                                        disableBack={!canGoBackTask('task4_1')}
                                        disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task4_1}
                                        isRefreshing={refreshLoadingByTask.task4_1}
                                        isCollapsed={collapsedTasks.has('task4_1')}
                                        onToggleCollapse={() => toggleTaskCollapse('task4_1')}
                                        onCheck={() => toggleTaskAnswer('task4_1')}
                                        isAnswerChecked={checkedAnswers.has('task4_1')}
                                    />
                                    <div className={`text-sm flex-1 space-y-1 variant-copy ${collapsedTasks.has('task4_1') ? 'hidden print:block' : ''}`}>
                                        <div className="flex items-start gap-3">
                                            <QuestionNumberBadge label="4.1" />
                                            <div className="flex-1">
                                                <RichTextBlock
                                                    value={variant.task4_1?.text}
                                                    fallback="Вопрос 4.1 не задан"
                                                    className="rich-content text-sm leading-relaxed"
                                                />
                                                {isAdmin && <AdminTaskMeta task={variant.task4_1} taskKey="task4_1" pinned={weeklyPins['task4_1'] !== undefined && weeklyPins['task4_1'] === String(variant.task4_1?.id ?? '')} pinConflict={getPinConflict('task4_1', variant.task4_1)} onPin={() => void handlePinTask('task4_1', String(variant.task4_1?.id ?? ''))} onUnpin={() => void handleUnpinTask('task4_1')} onSelect={() => openSelectModal('task4_1')} />}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <QuestionActions
                                        isLocked={!isPro}
                                        onRefresh={() => refreshTask('task4_2')}
                                        onBack={() => handleGoBackTask('task4_2')}
                                        disableBack={!canGoBackTask('task4_2')}
                                        disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task4_2}
                                        isRefreshing={refreshLoadingByTask.task4_2}
                                        isCollapsed={collapsedTasks.has('task4_2')}
                                        onToggleCollapse={() => toggleTaskCollapse('task4_2')}
                                        onCheck={() => toggleTaskAnswer('task4_2')}
                                        isAnswerChecked={checkedAnswers.has('task4_2')}
                                    />
                                    <div className={`text-sm flex-1 space-y-1 variant-copy ${collapsedTasks.has('task4_2') ? 'hidden print:block' : ''}`}>
                                        <div className="flex items-start gap-3">
                                            <QuestionNumberBadge label="4.2" />
                                            <div className="flex-1">
                                                <RichTextBlock
                                                    value={variant.task4_2?.text}
                                                    fallback="Вопрос 4.2 не задан"
                                                    className="rich-content text-sm leading-relaxed"
                                                />
                                                {isAdmin && <AdminTaskMeta task={variant.task4_2} taskKey="task4_2" pinned={weeklyPins['task4_2'] !== undefined && weeklyPins['task4_2'] === String(variant.task4_2?.id ?? '')} pinConflict={getPinConflict('task4_2', variant.task4_2)} onPin={() => void handlePinTask('task4_2', String(variant.task4_2?.id ?? ''))} onUnpin={() => void handleUnpinTask('task4_2')} onSelect={() => openSelectModal('task4_2')} />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <CollapsibleInstruction
                                value={knowledgeBaseSettings.variantTexts.part1Task5Lead}
                                fallback="Формулировка перед заданием 5 не задана."
                            />

                            <div className="flex items-start gap-3">
                                <QuestionActions
                                    isLocked={!isPro}
                                    onRefresh={() => refreshTask('task5')}
                                    onBack={() => handleGoBackTask('task5')}
                                    disableBack={!canGoBackTask('task5')}
                                    disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task5}
                                    isRefreshing={refreshLoadingByTask.task5}
                                    isCollapsed={collapsedTasks.has('task5')}
                                    onToggleCollapse={() => toggleTaskCollapse('task5')}
                                    onCheck={() => toggleTaskAnswer('task5')}
                                    isAnswerChecked={checkedAnswers.has('task5')}
                                />
                                <div className={`text-sm flex-1 space-y-1 variant-copy ${collapsedTasks.has('task5') ? 'hidden print:block' : ''}`}>
                                    <div className="flex items-start gap-3">
                                        <QuestionNumberBadge label="5." />
                                        <div className="flex-1">
                                            <RichTextBlock
                                                value={variant.task5?.text}
                                                fallback="Вопрос 5 не задан"
                                                className="rich-content text-sm leading-relaxed"
                                            />
                                            {isAdmin && <AdminTaskMeta task={variant.task5} taskKey="task5" pinned={weeklyPins['task5'] !== undefined && weeklyPins['task5'] === String(variant.task5?.id ?? '')} pinConflict={getPinConflict('task5', variant.task5)} onPin={() => void handlePinTask('task5', String(variant.task5?.id ?? ''))} onUnpin={() => void handleUnpinTask('task5')} onSelect={() => openSelectModal('task5')} />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <section className="print-part-break space-y-4">
                                <div className={`no-print ${styles.controlPanel}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <SelectField
                                            label="Автор"
                                            value={selectedPoetId}
                                            onChange={(value) => {
                                                setSelectedPoetId(value);
                                                setSelectedPoemId('');
                                            }}
                                            options={availablePoets.map((poet) => ({ value: poet.id, label: poet.name }))}
                                            placeholder="Выберите автора"
                                        />
                                        <div className="relative">
                                            <SelectField
                                                label="Стихотворение"
                                                value={selectedPoemId}
                                                onChange={(val) => {
                                                    if (!isPro) openPaywall('Выбор стихотворения доступен только по подписке.');
                                                    else setSelectedPoemId(val);
                                                }}
                                                options={availablePoems.map((poem) => ({ value: poem.id, label: poem.title }))}
                                                placeholder="Выберите стихотворение"
                                            />
                                            {!isPro && (
                                                <div
                                                    className="absolute inset-0 cursor-pointer z-10 bg-transparent flex items-center justify-end pr-8"
                                                    onClick={() => openPaywall('Выбор стихотворения доступен только по подписке.')}
                                                >
                                                    <IoLockClosedOutline className="text-gray-500 mt-5" />
                                                </div>
                                            )}
                                        </div>
                                        <SelectField
                                            label="Тема"
                                            value={selectedThemeId}
                                            onChange={setSelectedThemeId}
                                            options={allThemes}
                                            placeholder="Тема для задания 10"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            variant="outlined"
                                            onClick={refreshBlock2}
                                            disabled={isBusyWithFullOperations || isAnyTaskRefreshing || refreshLoadingByBlock.block2}
                                            className="inline-flex items-center gap-2"
                                        >
                                            {refreshLoadingByBlock.block2 && <IoRefreshOutline className="animate-spin" />}
                                            {!user && <IoLockClosedOutline className="opacity-50" />}
                                            Обновить стихотворение и задания 6–10
                                        </Button>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="no-print text-xs text-gray-500 flex flex-wrap items-center gap-1">
                                        <span>Поэт: {variant.poet?.name || '—'}</span>
                                        <AdminIdBadge id={variant.poet?.id} extra={variant.poet?.authorId ? `author:${variant.poet.authorId}` : undefined} />
                                        <span>| Стихотворение: {variant.poem?.title || '—'}</span>
                                        <AdminIdBadge id={variant.poem?.id} />
                                        {variant.poem?.themeInternalId && (
                                            <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-sans">
                                                тема: {variant.poem.themeInternalId}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <CollapsibleInstruction
                                    value={knowledgeBaseSettings.variantTexts.part2Intro}
                                    fallback="Инструкция ко второй части не задана."
                                    collapsible={false}
                                />

                                <div className="space-y-2">
                                    <div className="text-center font-bold uppercase">{variant.poem.title}</div>
                                    {getTextColumnsCount(variant.poem.textColumns) === 2 && (variant.poem.textSecondColumn || '').trim() ? (
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <RichTextBlock
                                                value={variant.poem.text}
                                                fallback="Текст стихотворения будет отображаться здесь."
                                                className="rich-content text-sm leading-relaxed variant-copy"
                                            />
                                            <RichTextBlock
                                                value={variant.poem.textSecondColumn}
                                                fallback=""
                                                className="rich-content text-sm leading-relaxed variant-copy"
                                            />
                                        </div>
                                    ) : (
                                        <RichTextBlock
                                            value={variant.poem.text}
                                            fallback="Текст стихотворения будет отображаться здесь."
                                            className="rich-content text-sm leading-relaxed text-center"
                                        />
                                    )}
                                    <div className="flex justify-end">
                                        <div className="text-right space-y-2">
                                            <div className="text-sm font-bold">{variant.poet.name}</div>
                                            <div className="no-print flex flex-wrap justify-end gap-2">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => navigatePoem('previous')}
                                                    disabled={!poemNavigation.hasPrevious || !isPro || refreshLoadingByBlock.block2}
                                                    className="inline-flex items-center gap-1"
                                                >
                                                    {refreshLoadingByBlock.block2 ? <IoRefreshOutline className="animate-spin" /> : (!isPro && <IoLockClosedOutline className="mr-1" />)}
                                                    Предыдущее стихотворение
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => navigatePoem('next')}
                                                    disabled={!poemNavigation.hasNext || !isPro || refreshLoadingByBlock.block2}
                                                    className="inline-flex items-center gap-1"
                                                >
                                                    {refreshLoadingByBlock.block2 ? <IoRefreshOutline className="animate-spin" /> : (!isPro && <IoLockClosedOutline className="mr-1" />)}
                                                    Следующее стихотворение
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`print-page-break ${styles.introCard} text-base leading-relaxed`}>
                                    <RichTextBlock
                                        value={knowledgeBaseSettings.variantTexts.part2QuestionsIntro}
                                        fallback="Формулировка перед заданиями 6–8 не задана."
                                        className="rich-content text-base leading-relaxed text-center"
                                    />
                                </div>

                                <div className={styles.taskStack}>
                                    <div className="flex items-start gap-3">
                                        <QuestionActions
                                            isLocked={!isPro}
                                            onRefresh={() => refreshTask('task6')}
                                            onBack={() => handleGoBackTask('task6')}
                                            disableBack={!canGoBackTask('task6')}
                                            disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task6}
                                            isRefreshing={refreshLoadingByTask.task6}
                                            isCollapsed={collapsedTasks.has('task6')}
                                            onToggleCollapse={() => toggleTaskCollapse('task6')}
                                            onCheck={() => toggleTaskAnswer('task6')}
                                            isAnswerChecked={checkedAnswers.has('task6')}
                                        />
                                        <div className={`flex-1 variant-copy ${collapsedTasks.has('task6') ? 'hidden print:block' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <QuestionNumberBadge label="6." />
                                                <div className="flex-1">
                                                    <div className="text-sm">Заполните пропуски.</div>
                                                    {isAdmin && <AdminTaskMeta task={variant.task6} taskKey="task6" pinned={weeklyPins['task6'] !== undefined && weeklyPins['task6'] === String(variant.task6?.id ?? '')} pinConflict={getPinConflict('task6', variant.task6)} onPin={() => void handlePinTask('task6', String(variant.task6?.id ?? ''))} onUnpin={() => void handleUnpinTask('task6')} onSelect={() => openSelectModal('task6')} />}
                                                </div>
                                            </div>
                                            <div className="text-sm mt-2">
                                                <RichTextBlock value={variant.task6?.part1} fallback="—" as="span" />
                                                {' '}
                                                <RichTextBlock value={variant.task6?.part2} fallback="—" as="span" />
                                            </div>
                                            <div className="text-sm opacity-60 mt-2">Ответ: __________________________________________________________________</div>
                                            {checkedAnswers.has('task6') && (
                                                <div className="text-xs opacity-80 mt-1">
                                                    Ответ: {variant.task6?.answer1 || '—'} / {variant.task6?.answer2 || '—'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <QuestionActions
                                            isLocked={!isPro}
                                            onRefresh={() => refreshTask('task7')}
                                            onBack={() => handleGoBackTask('task7')}
                                            disableBack={!canGoBackTask('task7')}
                                            disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task7}
                                            isRefreshing={refreshLoadingByTask.task7}
                                            isCollapsed={collapsedTasks.has('task7')}
                                            onToggleCollapse={() => toggleTaskCollapse('task7')}
                                            onCheck={() => toggleTaskAnswer('task7')}
                                            isAnswerChecked={checkedAnswers.has('task7')}
                                        />
                                        <div className={`flex-1 text-sm space-y-2 variant-copy ${collapsedTasks.has('task7') ? 'hidden print:block' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <QuestionNumberBadge label="7." />
                                                <div className="flex-1">
                                                    <RichTextBlock
                                                        value={variant.task7?.text}
                                                        fallback="Вопрос 7 не задан"
                                                        className="rich-content text-sm leading-relaxed"
                                                    />
                                                    {isAdmin && <AdminTaskMeta task={variant.task7} taskKey="task7" pinned={weeklyPins['task7'] !== undefined && weeklyPins['task7'] === String(variant.task7?.id ?? '')} pinConflict={getPinConflict('task7', variant.task7)} onPin={() => void handlePinTask('task7', String(variant.task7?.id ?? ''))} onUnpin={() => void handleUnpinTask('task7')} onSelect={() => openSelectModal('task7')} />}
                                                </div>
                                            </div>
                                            <div className="text-sm opacity-60">Ответ: ____________________</div>
                                            {checkedAnswers.has('task7') && (
                                                <div className="text-xs opacity-80">Ответ: {variant.task7?.answer || '—'}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <QuestionActions
                                            isLocked={!isPro}
                                            onRefresh={() => refreshTask('task8')}
                                            onBack={() => handleGoBackTask('task8')}
                                            disableBack={!canGoBackTask('task8')}
                                            disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task8}
                                            isRefreshing={refreshLoadingByTask.task8}
                                            isCollapsed={collapsedTasks.has('task8')}
                                            onToggleCollapse={() => toggleTaskCollapse('task8')}
                                            onCheck={() => toggleTaskAnswer('task8')}
                                            isAnswerChecked={checkedAnswers.has('task8')}
                                        />
                                        <div className={`flex-1 text-sm space-y-2 variant-copy ${collapsedTasks.has('task8') ? 'hidden print:block' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <QuestionNumberBadge label="8." />
                                                <div className="flex-1">
                                                    <RichTextBlock
                                                        value={variant.task8?.prompt}
                                                        fallback="Вопрос 8 не задан"
                                                        className="rich-content text-sm leading-relaxed"
                                                    />
                                                    {isAdmin && <AdminTaskMeta task={variant.task8} taskKey="task8" pinned={weeklyPins['task8'] !== undefined && weeklyPins['task8'] === String(variant.task8?.id ?? '')} pinConflict={getPinConflict('task8', variant.task8)} onPin={() => void handlePinTask('task8', String(variant.task8?.id ?? ''))} onUnpin={() => void handleUnpinTask('task8')} onSelect={() => openSelectModal('task8')} />}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                {(variant.task8Options || []).slice(0, TASK8_MAX_OPTIONS).map((option, index) => {
                                                    return (
                                                        <div key={`${option.id}-${index}`}>
                                                            {index + 1}. {option.term}
                                                        </div>
                                                    );
                                                })}
                                                {!(variant.task8Options || []).length && <div className="opacity-60">Варианты пока не сформированы.</div>}
                                            </div>
                                            <div className="text-sm opacity-60">Ответ: ____________________</div>
                                            {checkedAnswers.has('task8') && (
                                                <div className="text-xs opacity-80">
                                                    Ответ: {getTask8CorrectOptionNumbers((variant.task8Options || []).slice(0, TASK8_MAX_OPTIONS)).join(', ') || '—'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                <div className="print-page-break space-y-3">
                                    <CollapsibleInstruction
                                        value={knowledgeBaseSettings.variantTexts.part2Task9Lead}
                                        fallback="Формулировка перед заданиями 9.1 и 9.2 не задана."
                                    />

                                    <div className="new-test-divider" aria-hidden="true" />

                                    <CollapsibleInstruction
                                        value={knowledgeBaseSettings.variantTexts.part2Task9Criteria}
                                        fallback="Критерии и указания к заданиям 9.1/9.2 не заданы."
                                    />

                                    <div className="flex items-start gap-3">
                                        <QuestionActions
                                            isLocked={!isPro}
                                            onRefresh={() => refreshTask('task9_1')}
                                            onBack={() => handleGoBackTask('task9_1')}
                                            disableBack={!canGoBackTask('task9_1')}
                                            disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task9_1}
                                            isRefreshing={refreshLoadingByTask.task9_1}
                                            isCollapsed={collapsedTasks.has('task9_1')}
                                            onToggleCollapse={() => toggleTaskCollapse('task9_1')}
                                            onCheck={() => toggleTaskAnswer('task9_1')}
                                            isAnswerChecked={checkedAnswers.has('task9_1')}
                                        />
                                        <div className={`text-sm flex-1 space-y-1 variant-copy ${collapsedTasks.has('task9_1') ? 'hidden print:block' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <QuestionNumberBadge label="9.1" />
                                                <div className="flex-1">
                                                    <RichTextBlock
                                                        value={variant.task9_1?.text}
                                                        fallback="Вопрос 9.1 не задан"
                                                        className="rich-content text-sm leading-relaxed"
                                                    />
                                                    {isAdmin && <AdminTaskMeta task={variant.task9_1} taskKey="task9_1" pinned={weeklyPins['task9_1'] !== undefined && weeklyPins['task9_1'] === String(variant.task9_1?.id ?? '')} pinConflict={getPinConflict('task9_1', variant.task9_1)} onPin={() => void handlePinTask('task9_1', String(variant.task9_1?.id ?? ''))} onUnpin={() => void handleUnpinTask('task9_1')} onSelect={() => openSelectModal('task9_1')} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <QuestionActions
                                            isLocked={!isPro}
                                            onRefresh={() => refreshTask('task9_2')}
                                            onBack={() => handleGoBackTask('task9_2')}
                                            disableBack={!canGoBackTask('task9_2')}
                                            disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task9_2}
                                            isRefreshing={refreshLoadingByTask.task9_2}
                                            isCollapsed={collapsedTasks.has('task9_2')}
                                            onToggleCollapse={() => toggleTaskCollapse('task9_2')}
                                            onCheck={() => toggleTaskAnswer('task9_2')}
                                            isAnswerChecked={checkedAnswers.has('task9_2')}
                                        />
                                        <div className={`text-sm flex-1 space-y-1 variant-copy ${collapsedTasks.has('task9_2') ? 'hidden print:block' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <QuestionNumberBadge label="9.2" />
                                                <div className="flex-1">
                                                    <RichTextBlock
                                                        value={variant.task9_2?.text}
                                                        fallback="Вопрос 9.2 не задан"
                                                        className="rich-content text-sm leading-relaxed"
                                                    />
                                                    {isAdmin && <AdminTaskMeta task={variant.task9_2} taskKey="task9_2" pinned={weeklyPins['task9_2'] !== undefined && weeklyPins['task9_2'] === String(variant.task9_2?.id ?? '')} pinConflict={getPinConflict('task9_2', variant.task9_2)} onPin={() => void handlePinTask('task9_2', String(variant.task9_2?.id ?? ''))} onUnpin={() => void handleUnpinTask('task9_2')} onSelect={() => openSelectModal('task9_2')} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <CollapsibleInstruction
                                        value={knowledgeBaseSettings.variantTexts.part2Task10Lead}
                                        fallback="Формулировка перед заданием 10 не задана."
                                    />

                                    <div className="flex items-start gap-3">
                                        <QuestionActions
                                            isLocked={!isPro}
                                            onRefresh={() => refreshTask('task10')}
                                            onBack={() => handleGoBackTask('task10')}
                                            disableBack={!canGoBackTask('task10')}
                                            disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task10}
                                            isRefreshing={refreshLoadingByTask.task10}
                                            isCollapsed={collapsedTasks.has('task10')}
                                            onToggleCollapse={() => toggleTaskCollapse('task10')}
                                            onCheck={() => toggleTaskAnswer('task10')}
                                            isAnswerChecked={checkedAnswers.has('task10')}
                                        />
                                        <div className={`flex-1 text-sm variant-copy ${collapsedTasks.has('task10') ? 'hidden print:block' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <QuestionNumberBadge label="10." />
                                                <div className="flex-1">
                                                    <RichTextBlock
                                                        value={variant.task10?.text}
                                                        fallback="Вопрос 10 не задан"
                                                        className="rich-content text-sm leading-relaxed"
                                                    />
                                                    {isAdmin && <AdminTaskMeta task={variant.task10} taskKey="task10" pinned={weeklyPins['task10'] !== undefined && weeklyPins['task10'] === String(variant.task10?.id ?? '')} pinConflict={getPinConflict('task10', variant.task10)} onPin={() => void handlePinTask('task10', String(variant.task10?.id ?? ''))} onUnpin={() => void handleUnpinTask('task10')} onSelect={() => openSelectModal('task10')} />}
                                                </div>
                                            </div>
                                            {selectedThemeId && (
                                                <div className="no-print text-xs opacity-60 mt-1">Текущая тема фильтра: {selectedThemeId}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="print-part-break space-y-4">
                                <div className="text-center text-sm uppercase">Часть 2</div>
                                <CollapsibleInstruction
                                    value={knowledgeBaseSettings.variantTexts.part3Intro}
                                    fallback="Инструкция ко второй части (задания 11) не задана."
                                />

                                <div className={`no-print ${styles.controlPanel}`}>
                                    <div className="flex justify-end">
                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                if (!isPro) {
                                                    openPaywall('Полное обновление блока 11 доступно только по подписке.');
                                                    return;
                                                }
                                                refreshBlock3();
                                            }}
                                            disabled={isBusyWithFullOperations || isAnyTaskRefreshing || refreshLoadingByBlock.block3}
                                            className="inline-flex items-center gap-2"
                                        >
                                            {!isPro && <IoLockClosedOutline />}
                                            {refreshLoadingByBlock.block3 && <IoRefreshOutline className="animate-spin" />}
                                            Обновить задания 11
                                        </Button>
                                    </div>
                                </div>

                                <div className={styles.taskStack}>
                                    <div className="flex items-start gap-3">
                                        <QuestionActions
                                            isLocked={!isPro}
                                            onRefresh={() => refreshTask('task11_1')}
                                            onBack={() => handleGoBackTask('task11_1')}
                                            disableBack={!canGoBackTask('task11_1')}
                                            disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task11_1}
                                            isRefreshing={refreshLoadingByTask.task11_1}
                                            isCollapsed={collapsedTasks.has('task11_1')}
                                            onToggleCollapse={() => toggleTaskCollapse('task11_1')}
                                            onCheck={() => toggleTaskAnswer('task11_1')}
                                            isAnswerChecked={checkedAnswers.has('task11_1')}
                                        />
                                        <div className={`text-sm flex-1 variant-copy ${collapsedTasks.has('task11_1') ? 'hidden print:block' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <QuestionNumberBadge label="11.1" />
                                                <div className="flex-1">
                                                    <RichTextBlock value={variant.task11_1?.text} fallback="Вопрос 11.1 не задан" className="rich-content text-sm leading-relaxed" />
                                                    {isAdmin && <AdminTaskMeta task={variant.task11_1} showRod taskKey="task11_1" pinned={weeklyPins['task11_1'] !== undefined && weeklyPins['task11_1'] === String(variant.task11_1?.id ?? '')} pinConflict={getPinConflict('task11_1', variant.task11_1)} onPin={() => void handlePinTask('task11_1', String(variant.task11_1?.id ?? ''))} onUnpin={() => void handleUnpinTask('task11_1')} onSelect={() => openSelectModal('task11_1')} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <QuestionActions
                                            isLocked={!isPro}
                                            onRefresh={() => refreshTask('task11_2')}
                                            onBack={() => handleGoBackTask('task11_2')}
                                            disableBack={!canGoBackTask('task11_2')}
                                            disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task11_2}
                                            isRefreshing={refreshLoadingByTask.task11_2}
                                            isCollapsed={collapsedTasks.has('task11_2')}
                                            onToggleCollapse={() => toggleTaskCollapse('task11_2')}
                                            onCheck={() => toggleTaskAnswer('task11_2')}
                                            isAnswerChecked={checkedAnswers.has('task11_2')}
                                        />
                                        <div className={`text-sm flex-1 variant-copy ${collapsedTasks.has('task11_2') ? 'hidden print:block' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <QuestionNumberBadge label="11.2" />
                                                <div className="flex-1">
                                                    <RichTextBlock value={variant.task11_2?.text} fallback="Вопрос 11.2 не задан" className="rich-content text-sm leading-relaxed" />
                                                    {isAdmin && <AdminTaskMeta task={variant.task11_2} showRod taskKey="task11_2" pinned={weeklyPins['task11_2'] !== undefined && weeklyPins['task11_2'] === String(variant.task11_2?.id ?? '')} pinConflict={getPinConflict('task11_2', variant.task11_2)} onPin={() => void handlePinTask('task11_2', String(variant.task11_2?.id ?? ''))} onUnpin={() => void handleUnpinTask('task11_2')} onSelect={() => openSelectModal('task11_2')} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <QuestionActions
                                            isLocked={!isPro}
                                            onRefresh={() => refreshTask('task11_3')}
                                            onBack={() => handleGoBackTask('task11_3')}
                                            disableBack={!canGoBackTask('task11_3')}
                                            disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task11_3}
                                            isRefreshing={refreshLoadingByTask.task11_3}
                                            isCollapsed={collapsedTasks.has('task11_3')}
                                            onToggleCollapse={() => toggleTaskCollapse('task11_3')}
                                            onCheck={() => toggleTaskAnswer('task11_3')}
                                            isAnswerChecked={checkedAnswers.has('task11_3')}
                                        />
                                        <div className={`text-sm flex-1 variant-copy ${collapsedTasks.has('task11_3') ? 'hidden print:block' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <QuestionNumberBadge label="11.3" />
                                                <div className="flex-1">
                                                    <RichTextBlock value={variant.task11_3?.text} fallback="Вопрос 11.3 не задан" className="rich-content text-sm leading-relaxed" />
                                                    {isAdmin && <AdminTaskMeta task={variant.task11_3} showRod taskKey="task11_3" pinned={weeklyPins['task11_3'] !== undefined && weeklyPins['task11_3'] === String(variant.task11_3?.id ?? '')} pinConflict={getPinConflict('task11_3', variant.task11_3)} onPin={() => void handlePinTask('task11_3', String(variant.task11_3?.id ?? ''))} onUnpin={() => void handleUnpinTask('task11_3')} onSelect={() => openSelectModal('task11_3')} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <QuestionActions
                                            isLocked={!isPro}
                                            onRefresh={() => refreshTask('task11_4')}
                                            onBack={() => handleGoBackTask('task11_4')}
                                            disableBack={!canGoBackTask('task11_4')}
                                            disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task11_4}
                                            isRefreshing={refreshLoadingByTask.task11_4}
                                            isCollapsed={collapsedTasks.has('task11_4')}
                                            onToggleCollapse={() => toggleTaskCollapse('task11_4')}
                                            onCheck={() => toggleTaskAnswer('task11_4')}
                                            isAnswerChecked={checkedAnswers.has('task11_4')}
                                        />
                                        <div className={`text-sm flex-1 variant-copy ${collapsedTasks.has('task11_4') ? 'hidden print:block' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <QuestionNumberBadge label="11.4" />
                                                <div className="flex-1">
                                                    <RichTextBlock value={variant.task11_4?.text} fallback="Вопрос 11.4 не задан" className="rich-content text-sm leading-relaxed" />
                                                    {isAdmin && <AdminTaskMeta task={variant.task11_4} showRod taskKey="task11_4" pinned={weeklyPins['task11_4'] !== undefined && weeklyPins['task11_4'] === String(variant.task11_4?.id ?? '')} pinConflict={getPinConflict('task11_4', variant.task11_4)} onPin={() => void handlePinTask('task11_4', String(variant.task11_4?.id ?? ''))} onUnpin={() => void handleUnpinTask('task11_4')} onSelect={() => openSelectModal('task11_4')} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <QuestionActions
                                            isLocked={!isPro}
                                            onRefresh={() => refreshTask('task11_5')}
                                            onBack={() => handleGoBackTask('task11_5')}
                                            disableBack={!canGoBackTask('task11_5')}
                                            disableRefresh={isBusyWithFullOperations || refreshDisabledByTask.task11_5}
                                            isRefreshing={refreshLoadingByTask.task11_5}
                                            isCollapsed={collapsedTasks.has('task11_5')}
                                            onToggleCollapse={() => toggleTaskCollapse('task11_5')}
                                            onCheck={() => toggleTaskAnswer('task11_5')}
                                            isAnswerChecked={checkedAnswers.has('task11_5')}
                                        />
                                        <div className={`text-sm flex-1 variant-copy ${collapsedTasks.has('task11_5') ? 'hidden print:block' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <QuestionNumberBadge label="11.5" />
                                                <div className="flex-1">
                                                    <RichTextBlock value={variant.task11_5?.text} fallback="Вопрос 11.5 не задан" className="rich-content text-sm leading-relaxed" />
                                                    {isAdmin && <AdminTaskMeta task={variant.task11_5} showRod taskKey="task11_5" pinned={weeklyPins['task11_5'] !== undefined && weeklyPins['task11_5'] === String(variant.task11_5?.id ?? '')} pinConflict={getPinConflict('task11_5', variant.task11_5)} onPin={() => void handlePinTask('task11_5', String(variant.task11_5?.id ?? ''))} onUnpin={() => void handleUnpinTask('task11_5')} onSelect={() => openSelectModal('task11_5')} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                        </div>
                    )}
                </div>

                {variant && (
                    <div className={`no-print ${styles.bottomActions}`}>
                        <button
                            type="button"
                            className={styles.bottomActionButton}
                            onClick={() => generateVariant(false)}
                            disabled={isBusyWithFullOperations || isAnyTaskRefreshing}
                        >
                            {variantGenerationMode === 'new' ? <IoRefreshOutline className="animate-spin" /> : <IoDocumentTextOutline />}
                            Новый рандомный вариант
                        </button>
                        <button
                            type="button"
                            className={styles.bottomActionButton}
                            onClick={() => generateVariant(true)}
                            disabled={isBusyWithFullOperations || isAnyTaskRefreshing}
                        >
                            {variantGenerationMode === 'selected' ? <IoRefreshOutline className="animate-spin" /> : <IoRefreshOutline />}
                            Обновить все задания в варианте
                        </button>
                    </div>
                )}
            </div>

            <NewTestActionDock
                isVisible={Boolean(variant)}
                dockLiftOffset={dockLiftOffset}
                exportQuota={exportQuota}
                statusMessage={statusMessage}
                isDownloadingPdf={isDownloadingPdf}
                isSavingVariant={isSavingVariant}
                isMobileDockOpen={isMobileDockOpen}
                setIsMobileDockOpen={setIsMobileDockOpen}
                isBusyWithFullOperations={isBusyWithFullOperations}
                isAnyTaskRefreshing={isAnyTaskRefreshing}
                variantGenerationMode={variantGenerationMode}
                showAnswers={showAnswers}
                getQuotaCaption={getQuotaCaption}
                handleDownload={handleDownload}
                handlePrint={handlePrint}
                openFeedbackModal={openFeedbackModal}
                handleSaveVariant={handleSaveVariant}
                generateVariant={generateVariant}
                handleCheckYourself={handleCheckYourself}
            />
        </PageLayout>
    );
}
