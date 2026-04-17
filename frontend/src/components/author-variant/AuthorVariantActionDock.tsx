'use client';

import {
    IoChevronDownOutline,
    IoChevronUpOutline,
    IoDownloadOutline,
    IoHelpCircleOutline,
    IoPrintOutline,
    IoEyeOutline,
    IoEyeOffOutline,
} from 'react-icons/io5';

import AuthorVariantDockButton from '@/components/author-variant/AuthorVariantDockButton';
import type { AuthorVariantActionDockProps } from '@/types/ui/authorVariant';

export default function AuthorVariantActionDock({
    showAnswers,
    isMobileDockOpen,
    quotaCaption,
    statusMessage,
    isDownloadingPdf,
    onToggleAnswers,
    onToggleMobileDock,
    onDownload,
    onPrint,
    onOpenFeedback,
}: AuthorVariantActionDockProps) {
    return (
        <div className="no-print fixed inset-x-0 bottom-4 z-40 px-4">
            <div className="mx-auto w-full max-w-[940px]">
                <div className="hidden rounded-[28px] border border-gray-200 bg-white/95 px-4 py-4 shadow-[0_16px_60px_rgba(34,30,32,0.16)] backdrop-blur md:block">
                    <div className="mb-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-50">Панель варианта</div>
                            <div className="text-xs opacity-60">{quotaCaption}</div>
                            {statusMessage ? <div className="mt-1 text-xs opacity-70">{statusMessage}</div> : null}
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={onDownload} disabled={isDownloadingPdf} className="flex h-11 px-3 gap-2 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 font-medium text-sm" aria-label="Скачать PDF">
                                <IoDownloadOutline size={18} />
                                <span>Скачать</span>
                            </button>
                            <button type="button" onClick={onPrint} className="flex h-11 px-3 gap-2 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5 font-medium text-sm" aria-label="Распечатать вариант">
                                <IoPrintOutline size={18} />
                                <span>Печать</span>
                            </button>
                            <button type="button" onClick={onOpenFeedback} className="flex h-11 px-3 gap-2 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5 font-medium text-sm" aria-label="Открыть обратную связь">
                                <IoHelpCircleOutline size={18} />
                                <span>Помощь</span>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:max-w-[260px]">
                        <AuthorVariantDockButton onClick={onToggleAnswers}>
                            <span className="inline-flex items-center gap-2">
                                {showAnswers ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                                {showAnswers ? 'Скрыть проверку' : 'Проверить себя'}
                            </span>
                        </AuthorVariantDockButton>
                    </div>
                </div>

                <div className="rounded-[26px] border border-gray-200 bg-white/95 shadow-[0_12px_40px_rgba(34,30,32,0.14)] backdrop-blur md:hidden">
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] opacity-50">Панель варианта</div>
                            <div className="text-[11px] opacity-60">{quotaCaption}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={onDownload} disabled={isDownloadingPdf} className="flex h-10 px-3 gap-2 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 font-medium text-xs" aria-label="Скачать PDF">
                                <IoDownloadOutline size={17} />
                                <span>Скачать</span>
                            </button>
                            <button type="button" onClick={onPrint} className="flex h-10 px-3 gap-2 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5 font-medium text-xs" aria-label="Распечатать вариант">
                                <IoPrintOutline size={17} />
                                <span>Печать</span>
                            </button>
                            <button type="button" onClick={onOpenFeedback} className="flex h-10 px-3 gap-2 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5 font-medium text-xs" aria-label="Открыть обратную связь">
                                <IoHelpCircleOutline size={17} />
                                <span>Помощь</span>
                            </button>
                            <button type="button" onClick={onToggleMobileDock} className="flex h-10 px-2 items-center justify-center rounded-2xl border border-[#221E20]/15 transition-colors hover:bg-black/5" aria-label={isMobileDockOpen ? 'Свернуть панель действий' : 'Развернуть панель действий'}>
                                {isMobileDockOpen ? <IoChevronDownOutline size={17} /> : <IoChevronUpOutline size={17} />}
                            </button>
                        </div>
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ease-out ${isMobileDockOpen ? 'max-h-[22rem] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="border-t border-gray-200 px-4 pb-4 pt-3">
                            <div className="grid grid-cols-1 gap-2">
                                <AuthorVariantDockButton onClick={onToggleAnswers} fullWidth>
                                    <span className="inline-flex items-center gap-2">
                                        {showAnswers ? <IoEyeOffOutline className="text-lg" /> : <IoEyeOutline className="text-lg" />}
                                        {showAnswers ? 'Скрыть проверку' : 'Проверить себя'}
                                    </span>
                                </AuthorVariantDockButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
