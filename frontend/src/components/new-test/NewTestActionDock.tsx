import type { Dispatch, SetStateAction } from 'react';
import {
    IoChevronDownOutline,
    IoChevronUpOutline,
    IoDownloadOutline,
    IoEyeOffOutline,
    IoEyeOutline,
    IoHelpCircleOutline,
    IoPrintOutline,
    IoRefreshOutline,
    IoSaveOutline,
} from 'react-icons/io5';
import type { VariantExportQuota } from '@/lib/variantsApi';
import DockButton from '@/components/new-test/DockButton';

interface NewTestActionDockProps {
    isVisible: boolean;
    dockLiftOffset: number;
    exportQuota: VariantExportQuota | null;
    statusMessage: string;
    isDownloadingPdf: boolean;
    isSavingVariant: boolean;
    isMobileDockOpen: boolean;
    setIsMobileDockOpen: Dispatch<SetStateAction<boolean>>;
    isBusyWithFullOperations: boolean;
    isAnyTaskRefreshing: boolean;
    variantGenerationMode: 'new' | 'selected' | null;
    showAnswers: boolean;
    getQuotaCaption: (exportQuota: VariantExportQuota | null) => string;
    handleDownload: () => void;
    handlePrint: () => void;
    openFeedbackModal: () => void;
    handleSaveVariant: () => void;
    generateVariant: (isFullRefresh: boolean) => void;
    handleCheckYourself: () => void;
}

export default function NewTestActionDock({
    isVisible,
    dockLiftOffset,
    exportQuota,
    statusMessage,
    isDownloadingPdf,
    isSavingVariant,
    isMobileDockOpen,
    setIsMobileDockOpen,
    isBusyWithFullOperations,
    isAnyTaskRefreshing,
    variantGenerationMode,
    showAnswers,
    getQuotaCaption,
    handleDownload,
    handlePrint,
    openFeedbackModal,
    handleSaveVariant,
    generateVariant,
    handleCheckYourself,
}: NewTestActionDockProps) {
    if (!isVisible) return null;

    return (
        <div
            className="no-print fixed inset-x-0 z-40 px-4"
            style={{ bottom: `${16 + dockLiftOffset}px` }}
        >
            <div className="mx-auto w-full max-w-[940px]">
                <div className="hidden md:block rounded-[28px] border border-gray-200 bg-white/95 px-4 py-4 shadow-[0_16px_60px_rgba(34,30,32,0.16)] backdrop-blur">
                    <div className="mb-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-50">Панель варианта</div>
                            <div className="text-xs opacity-60">
                                {getQuotaCaption(exportQuota)}
                            </div>
                            {statusMessage && <div className="mt-1 text-xs opacity-70">{statusMessage}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={isDownloadingPdf}
                                className="flex h-11 px-3 gap-2 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 font-medium text-sm"
                                aria-label="Скачать PDF"
                            >
                                <IoDownloadOutline size={18} />
                                <span>Скачать</span>
                            </button>
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="flex h-11 px-3 gap-2 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5 font-medium text-sm"
                                aria-label="Распечатать вариант"
                            >
                                <IoPrintOutline size={18} />
                                <span>Печать</span>
                            </button>
                            <button
                                type="button"
                                onClick={openFeedbackModal}
                                className="flex h-11 px-3 gap-2 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5 font-medium text-sm"
                                aria-label="Открыть обратную связь"
                            >
                                <IoHelpCircleOutline size={18} />
                                <span>Помощь</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveVariant}
                                disabled={isSavingVariant}
                                className="flex h-11 px-3 gap-2 items-center justify-center rounded-2xl border border-blue-600/30 text-blue-600 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 font-medium text-sm"
                                aria-label="Сохранить вариант"
                                title="Сохранить вариант"
                            >
                                {isSavingVariant ? <IoRefreshOutline className="animate-spin text-blue-600" size={18} /> : <IoSaveOutline size={18} className="text-blue-600" />}
                                <span>{isSavingVariant ? 'Сохраняем...' : 'Сохранить'}</span>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-[0.9fr_1.35fr_0.95fr] gap-2">
                        <DockButton onClick={() => generateVariant(false)} disabled={isBusyWithFullOperations || isAnyTaskRefreshing}>
                            <span className="inline-flex items-center gap-2">
                                {variantGenerationMode === 'new' && <IoRefreshOutline className="animate-spin" />}
                                Новый вариант
                            </span>
                        </DockButton>
                        <DockButton onClick={() => generateVariant(true)} disabled={isBusyWithFullOperations || isAnyTaskRefreshing}>
                            <span className="inline-flex items-center gap-2">
                                {variantGenerationMode === 'selected' && <IoRefreshOutline className="animate-spin" />}
                                Обновить все
                            </span>
                        </DockButton>
                        <DockButton onClick={handleCheckYourself} disabled={isBusyWithFullOperations}>
                            <span className="inline-flex items-center gap-2">
                                {showAnswers ? <IoEyeOffOutline className="text-lg" /> : <IoEyeOutline className="text-lg" />}
                                {showAnswers ? 'Скрыть проверку' : 'Проверить себя'}
                            </span>
                        </DockButton>
                    </div>
                </div>

                <div className="md:hidden rounded-[26px] border border-gray-200 bg-white/95 shadow-[0_12px_40px_rgba(34,30,32,0.14)] backdrop-blur">
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-50">Панель варианта</div>
                            <div className="text-[11px] opacity-60">
                                {getQuotaCaption(exportQuota)}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={isDownloadingPdf}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Скачать PDF"
                            >
                                <IoDownloadOutline size={17} />
                            </button>
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5"
                                aria-label="Распечатать вариант"
                            >
                                <IoPrintOutline size={17} />
                            </button>
                            <button
                                type="button"
                                onClick={openFeedbackModal}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5"
                                aria-label="Открыть обратную связь"
                            >
                                <IoHelpCircleOutline size={17} />
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveVariant}
                                disabled={isSavingVariant}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 text-blue-600 border-blue-600/30"
                                aria-label="Сохранить вариант"
                                title="Сохранить вариант"
                            >
                                {isSavingVariant ? <IoRefreshOutline className="animate-spin text-blue-600" size={17} /> : <IoSaveOutline size={17} className="text-blue-600" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsMobileDockOpen((prev) => !prev)}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5"
                                aria-label={isMobileDockOpen ? 'Свернуть панель действий' : 'Развернуть панель действий'}
                            >
                                {isMobileDockOpen ? <IoChevronDownOutline size={17} /> : <IoChevronUpOutline size={17} />}
                            </button>
                        </div>
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ease-out ${isMobileDockOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="border-t border-gray-200 px-4 pb-4 pt-3">
                            {statusMessage && <div className="mb-3 text-xs opacity-70">{statusMessage}</div>}
                            <div className="grid grid-cols-1 gap-2">
                                <DockButton
                                    onClick={() => generateVariant(false)}
                                    fullWidth
                                    disabled={isBusyWithFullOperations || isAnyTaskRefreshing}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        {variantGenerationMode === 'new' && <IoRefreshOutline className="animate-spin" />}
                                        Новый вариант
                                    </span>
                                </DockButton>
                                <DockButton
                                    onClick={() => generateVariant(true)}
                                    fullWidth
                                    disabled={isBusyWithFullOperations || isAnyTaskRefreshing}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        {variantGenerationMode === 'selected' && <IoRefreshOutline className="animate-spin" />}
                                        Обновить все
                                    </span>
                                </DockButton>
                                <DockButton onClick={handleCheckYourself} fullWidth disabled={isBusyWithFullOperations}>
                                    {showAnswers ? 'Скрыть проверку' : 'Проверить себя'}
                                </DockButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
