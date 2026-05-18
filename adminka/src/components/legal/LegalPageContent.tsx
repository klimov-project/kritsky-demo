import PageLayout from '@/components/layout/PageLayout';
import type { LegalPageContentProps } from '@/types/ui/legalPage';

export default function LegalPageContent({ document }: LegalPageContentProps) {
    return (
        <PageLayout hideHeader={false} hideFooter={false}>
            <div className="w-full flex flex-col items-center min-h-screen py-20 px-4">
                <div className="w-full max-w-[800px]">
                    <h1 className="font-serif font-bold text-3xl mb-10 text-[#221E20]">{document.title}</h1>

                    <div className="font-serif text-[#221E20] opacity-80 space-y-6 leading-relaxed">
                        <p>{document.intro}</p>

                        {document.sections.map((section) => (
                            <section key={section.title} className="space-y-4">
                                <h2 className="font-bold text-xl pt-4 opacity-100">{section.title}</h2>
                                {section.paragraphs.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
