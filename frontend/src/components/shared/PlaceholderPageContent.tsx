import PageLayout from '@/components/layout/PageLayout';
import type { PlaceholderPageContentProps } from '@/types/ui/placeholderPage';

export default function PlaceholderPageContent({ title, description }: PlaceholderPageContentProps) {
    return (
        <PageLayout>
            <div className="py-20 flex flex-col items-center font-serif">
                <h1 className="text-3xl font-bold mb-4">{title}</h1>
                <p className="opacity-60">{description}</p>
            </div>
        </PageLayout>
    );
}
