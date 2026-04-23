import type { Dispatch, SetStateAction } from 'react';
import {
    IoDownloadOutline,
    IoHelpCircleOutline,
    IoPrintOutline,
    IoRefreshOutline,
    IoSaveOutline,
} from 'react-icons/io5';
import type { VariantExportQuota } from '@/lib/variantsApi';
import DockButton from '@/components/new-test/DockButton';
import styles from './NewTestActionDock.module.scss';

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
            className={`no-print ${styles.dockRoot}`}
            style={{ bottom: `${16 + dockLiftOffset}px` }}
        >
            <div className={styles.dockInner}>
                <div className={styles.desktopDock}>
                    <div className={styles.desktopTop}>
                        <div className={styles.caption}>
                            <div className={styles.captionTitle}>Панель варианта</div>
                            <div className={styles.captionQuota}>
                                {getQuotaCaption(exportQuota)}
                            </div>
                            {statusMessage && <div className={styles.captionStatus}>{statusMessage}</div>}
                        </div>
                    </div>

                    <div className={styles.desktopActions}>
                        <DockButton onClick={handleDownload} disabled={isDownloadingPdf}>
                            <span className="inline-flex items-center gap-2">
                                <IoDownloadOutline size={16} />
                                Скачать
                            </span>
                        </DockButton>
                        <DockButton onClick={handlePrint}>
                            <span className="inline-flex items-center gap-2">
                                <IoPrintOutline size={16} />
                                Печать
                            </span>
                        </DockButton>
                        <DockButton onClick={handleSaveVariant} disabled={isSavingVariant}>
                            <span className="inline-flex items-center gap-2">
                                {isSavingVariant ? <IoRefreshOutline className="animate-spin" size={16} /> : <IoSaveOutline size={16} />}
                                {isSavingVariant ? 'Сохраняем...' : 'Сохранить'}
                            </span>
                        </DockButton>
                        <DockButton onClick={openFeedbackModal}>
                            <span className="inline-flex items-center gap-2">
                                <IoHelpCircleOutline size={16} />
                                Помощь
                            </span>
                        </DockButton>
                    </div>
                </div>

                <div className={styles.mobileDock}>
                    <div className={styles.mobileHead}>
                        <div className={styles.mobileHeadMeta}>
                            <div className={styles.mobileTitle}>Панель варианта</div>
                            <div className={styles.mobileQuota}>
                                {getQuotaCaption(exportQuota)}
                            </div>
                            {statusMessage && <div className={styles.mobileStatus}>{statusMessage}</div>}
                        </div>
                    </div>

                    <div className={styles.mobileActions}>
                        <DockButton onClick={handleDownload} fullWidth disabled={isDownloadingPdf}>
                            <span className="inline-flex items-center gap-2">
                                <IoDownloadOutline />
                                Скачать
                            </span>
                        </DockButton>
                        <DockButton onClick={handlePrint} fullWidth>
                            <span className="inline-flex items-center gap-2">
                                <IoPrintOutline />
                                Печать
                            </span>
                        </DockButton>
                        <DockButton onClick={handleSaveVariant} fullWidth disabled={isSavingVariant}>
                            <span className="inline-flex items-center gap-2">
                                {isSavingVariant ? <IoRefreshOutline className="animate-spin" /> : <IoSaveOutline />}
                                {isSavingVariant ? 'Сохр...' : 'Сохранить'}
                            </span>
                        </DockButton>
                        <DockButton onClick={openFeedbackModal} fullWidth>
                            <span className="inline-flex items-center gap-2">
                                <IoHelpCircleOutline />
                                Помощь
                            </span>
                        </DockButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
