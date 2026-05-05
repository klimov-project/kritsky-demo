import {
    IoDownloadOutline,
    IoPrintOutline,
    IoRefreshOutline,
    IoSaveOutline,
    IoShareSocialOutline,
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
    getQuotaCaption: (exportQuota: VariantExportQuota | null) => string;
    handleDownload: () => void;
    handlePrint: () => void;
    handleSaveVariant: () => void;
}

export default function NewTestActionDock({
    isVisible,
    dockLiftOffset,
    exportQuota,
    statusMessage,
    isDownloadingPdf,
    isSavingVariant,
    getQuotaCaption,
    handleDownload,
    handlePrint,
    handleSaveVariant,
}: NewTestActionDockProps) {
    if (!isVisible) return null;

    const handleShare = async () => {
        const sharePayload = {
            title: document.title || 'ЕГЭ Крицкий',
            url: window.location.href,
        };

        if (navigator.share) {
            await navigator.share(sharePayload);
            return;
        }

        await navigator.clipboard.writeText(window.location.href);
    };

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
                        <DockButton onClick={() => void handleShare()}>
                            <span className="inline-flex items-center gap-2">
                                <IoShareSocialOutline size={16} />
                                Поделиться
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
                        <DockButton onClick={() => void handleShare()} fullWidth>
                            <span className="inline-flex items-center gap-2">
                                <IoShareSocialOutline />
                                Поделиться
                            </span>
                        </DockButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
