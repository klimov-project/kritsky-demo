'use client';

import AuthorVariantActionDock from '@/components/author-variant/AuthorVariantActionDock';
import AuthorVariantContent from '@/components/author-variant/AuthorVariantContent';
import AuthorVariantGlobalStyles from '@/components/author-variant/AuthorVariantGlobalStyles';
import PageLayout from '@/components/layout/PageLayout';
import FeedbackPopup from '@/components/shared/FeedbackPopup';
import { useAuth } from '@/context/AuthContext';
import { useAuthorVariantPage } from '@/hooks/useAuthorVariantPage';
import { AUTHOR_VARIANT_SUPPORT_EMAIL } from '@/utils/authorVariant';

export default function AuthorVariantPage() {
    const { user } = useAuth();
    const {
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
    } = useAuthorVariantPage({ user });

    return (
        <PageLayout bodyClassName="test-variant-page test-page-with-bg">
            <AuthorVariantGlobalStyles />

            {user?.isBlocked && (
                <div className="fixed inset-0 bg-white z-9999 flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md space-y-6">
                        <div className="text-6xl mb-4">🚫</div>
                        <h1 className="text-3xl font-bold text-red-600">Ваш аккаунт заблокирован</h1>
                        <p className="text-lg text-gray-600">
                            Доступ к конструктору ограничен администратором. Если вы считаете, что это ошибка, обратитесь в поддержку к админу по почте {AUTHOR_VARIANT_SUPPORT_EMAIL}.
                        </p>
                    </div>
                </div>
            )}

            <head>
                <title>Вариант недели | Kritsky</title>
                <meta name="description" content="Еженедельный тренировочный вариант ЕГЭ по литературе." />
            </head>

            <FeedbackPopup
                isOpen={showFeedbackModal}
                onClose={closeFeedbackModal}
                defaultName={user?.name || ''}
                defaultEmail={user?.email || ''}
                onSubmit={handleSendFeedback}
            />

            <div className="mx-auto w-full max-w-[960px] px-4 py-8 pb-40 ">
                <div className="print-area test-content-surface min-w-0 variant-uniform mx-auto w-full max-w-[860px]">
                    {isLoading && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm">
                            Загружаю вариант недели...
                        </div>
                    )}

                    {!isLoading && error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && !variant && (
                        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm">
                            Вариант недели пока не подготовлен.
                        </div>
                    )}

                    {!isLoading && !error && variant && (
                        <AuthorVariantContent
                            variant={variant}
                            settings={settings}
                            showAnswers={showAnswers}
                        />
                    )}
                </div>
            </div>

            {variant && (
                <AuthorVariantActionDock
                    showAnswers={showAnswers}
                    isMobileDockOpen={isMobileDockOpen}
                    quotaCaption={quotaCaption}
                    statusMessage={statusMessage}
                    isDownloadingPdf={isDownloadingPdf}
                    onToggleAnswers={toggleAnswers}
                    onToggleMobileDock={toggleMobileDock}
                    onDownload={handleDownload}
                    onPrint={handlePrint}
                    onOpenFeedback={openFeedbackModal}
                />
            )}
        </PageLayout>
    );
}
