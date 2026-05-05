import { useCallback, useEffect, useMemo, useState } from 'react';

import { loadAuthorVariantExportQuota, loadAuthorVariantKnowledgeBase, consumeAuthorVariantExportQuota } from '@/lib/api/authorVariant';
import { downloadElementAsPdf } from '@/lib/pdfDownload';
import { DEFAULT_KNOWLEDGE_BASE_SETTINGS } from '@/mocks/materials';
import type { AuthorVariantFeedbackPayload, AuthorVariantExportQuotaState } from '@/types/api/authorVariant';
import type { UseAuthorVariantPageOptions, UseAuthorVariantPageResult } from '@/types/ui/authorVariant';
import {
    AUTHOR_VARIANT_SUPPORT_EMAIL,
    buildAuthorVariantFeedbackBody,
    buildAuthorVariantPdfFileName,
    getAuthorVariantQuotaCaption,
    resolveAuthorVariantFromKnowledgeBase,
} from '@/utils/authorVariant';

export const useAuthorVariantPage = ({ user }: UseAuthorVariantPageOptions): UseAuthorVariantPageResult => {
    const [variant, setVariant] = useState<UseAuthorVariantPageResult['variant']>(null);
    const [settings, setSettings] = useState(DEFAULT_KNOWLEDGE_BASE_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAnswers, setShowAnswers] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [isMobileDockOpen, setIsMobileDockOpen] = useState(false);
    const [exportQuota, setExportQuota] = useState<AuthorVariantExportQuotaState>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await loadAuthorVariantKnowledgeBase();
                if (cancelled) return;

                setSettings(data.settings);
                setVariant(resolveAuthorVariantFromKnowledgeBase(data.settings, data.works, data.poets, data.block3));
            } catch (errorValue) {
                if (!cancelled) {
                    setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить вариант от автора');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!user || user.role === 'admin') {
            setExportQuota(null);
            return;
        }

        let cancelled = false;

        const loadQuota = async () => {
            try {
                const quota = await loadAuthorVariantExportQuota();
                if (!cancelled) {
                    setExportQuota(quota);
                }
            } catch {
                if (!cancelled) {
                    setExportQuota(null);
                }
            }
        };

        void loadQuota();
        return () => {
            cancelled = true;
        };
    }, [user]);

    const quotaCaption = useMemo(() => {
        return getAuthorVariantQuotaCaption(user, exportQuota);
    }, [user, exportQuota]);

    const consumeExportQuota = useCallback(async () => {
        if (!user) {
            setStatusMessage('Чтобы скачать или распечатать вариант, войдите в аккаунт.');
            return false;
        }

        if (user.role === 'admin') {
            return true;
        }

        try {
            const result = await consumeAuthorVariantExportQuota();
            setExportQuota(result.quota);
            setStatusMessage(result.source === 'free'
                ? 'Использовано бесплатное скачивание по подписке.'
                : 'Использовано скачивание из купленного пакета.');
            return true;
        } catch (errorValue) {
            setStatusMessage(errorValue instanceof Error ? errorValue.message : 'Скачивание недоступно.');
            return false;
        }
    }, [user]);

    const handleDownload = useCallback(async () => {
        if (!variant || isDownloadingPdf) return;

        const allowed = await consumeExportQuota();
        if (!allowed) return;

        const printArea = document.querySelector<HTMLElement>('.print-area');
        if (!printArea) {
            setStatusMessage('Не найден блок варианта для скачивания PDF.');
            return;
        }

        setIsDownloadingPdf(true);
        try {
            await downloadElementAsPdf({
                element: printArea,
                fileName: buildAuthorVariantPdfFileName(variant),
            });
            setStatusMessage('PDF успешно скачан.');
        } catch (errorValue) {
            setStatusMessage(errorValue instanceof Error ? errorValue.message : 'Не удалось скачать PDF.');
        } finally {
            setIsDownloadingPdf(false);
        }
    }, [consumeExportQuota, isDownloadingPdf, variant]);

    const handlePrint = useCallback(async () => {
        const allowed = await consumeExportQuota();
        if (!allowed) return;

        window.print();
    }, [consumeExportQuota]);

    const openFeedbackModal = useCallback(() => {
        setShowFeedbackModal(true);
    }, []);

    const closeFeedbackModal = useCallback(() => {
        setShowFeedbackModal(false);
    }, []);

    const handleSendFeedback = useCallback(async (payload: AuthorVariantFeedbackPayload) => {
        const body = buildAuthorVariantFeedbackBody(payload);
        window.location.href = `mailto:${AUTHOR_VARIANT_SUPPORT_EMAIL}?subject=${encodeURIComponent('Вопрос по варианту от автора')}&body=${encodeURIComponent(body)}`;
    }, []);

    const toggleAnswers = useCallback(() => {
        setShowAnswers((previous) => !previous);
    }, []);

    const toggleMobileDock = useCallback(() => {
        setIsMobileDockOpen((previous) => !previous);
    }, []);

    return {
        variant,
        settings,
        isLoading,
        error,
        showAnswers,
        showFeedbackModal,
        isMobileDockOpen,
        statusMessage,
        isDownloadingPdf,
        quotaCaption,
        openFeedbackModal,
        closeFeedbackModal,
        toggleAnswers,
        toggleMobileDock,
        handleDownload,
        handlePrint,
        handleSendFeedback,
    };
};
