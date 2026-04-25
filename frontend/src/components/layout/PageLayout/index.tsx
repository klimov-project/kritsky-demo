import React, { ReactNode } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import ScrollToTopButton from '../ScrollToTopButton';

interface PageLayoutProps {
    children: ReactNode;
    hideHeader?: boolean;
    hideFooter?: boolean;
    bodyClassName?: string;
}

interface PageLayoutShellProps {
    children: ReactNode;
    hideHeader?: boolean;
    hideFooter?: boolean;
    shellClassName?: string;
}

function PageLayoutShell({ children, hideHeader, hideFooter, shellClassName = '' }: PageLayoutShellProps) {
    return (
        <div className={`w-full min-h-screen flex flex-col relative ${shellClassName}`}>
            {!hideHeader && <Header />}

            <main className="mx-auto max-w-[1440px] w-full px-4 lg:px-8 flex-1 flex flex-col">
                {children}
            </main>

            {!hideFooter && <Footer />}
            <ScrollToTopButton />
        </div>
    );
}

export default function PageLayout({
    children,
    hideHeader = false,
    hideFooter = false,
    bodyClassName = ''
}: PageLayoutProps) {
    const isIndexPage = bodyClassName.includes('index-page');
    const hasBackgroundLayer = isIndexPage;

    return (
        <div className={`${bodyClassName} ${hasBackgroundLayer ? 'relative overflow-hidden' : ''}`}>
            {isIndexPage ? (
                <>
                    <div
                        className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.18]"
                        style={{ backgroundImage: "url('/landing_bg.png')" }}
                        aria-hidden="true"
                    />
                    <div
                        className="absolute inset-0 bg-white/80"
                        aria-hidden="true"
                    />
                </>
            ) : null}
            <PageLayoutShell
                hideHeader={hideHeader}
                hideFooter={hideFooter}
                shellClassName={hasBackgroundLayer ? 'bg-transparent z-10' : 'bg-white'}
            >
                {children}
            </PageLayoutShell>
        </div>
    );
}
