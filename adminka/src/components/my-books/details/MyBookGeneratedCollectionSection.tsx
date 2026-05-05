'use client';

import Button from '@/components/shared/Button';
import MyBookGeneratedVariantCard from '@/components/my-books/details/MyBookGeneratedVariantCard';
import type { MyBookGeneratedCollectionSectionProps } from '@/types/ui/myBookDetails';
import { getMyBookDetailsExcerptHtml, getMyBookDetailsPackTitle } from '@/utils/myBookDetails';

export default function MyBookGeneratedCollectionSection({
    packs,
    purchaseQuantity,
    authorName,
    revealedAnswers,
    onToggleAnswers,
    onDownloadPdf,
    onPrint,
}: MyBookGeneratedCollectionSectionProps) {
    return (
        <div className="mt-8 space-y-6">
            <div className="no-print flex flex-wrap gap-3">
                <Button variant="filled" onClick={onDownloadPdf}>
                    Скачать PDF
                </Button>
                <Button variant="outlined" onClick={onPrint}>
                    Распечатать
                </Button>
            </div>

            {packs.map((pack) => (
                <section key={pack.index} className="border border-[#221E20]/10 rounded-xl bg-white p-6 space-y-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="font-serif text-2xl font-bold text-[#221E20]">
                            {getMyBookDetailsPackTitle(purchaseQuantity, pack.index)}
                        </h2>
                        <p className="text-sm text-[#221E20]/60">
                            Варианты 1–5 по автору {authorName}
                        </p>
                    </div>

                    {pack.variants.map((variant) => (
                        <MyBookGeneratedVariantCard
                            key={variant.id}
                            variant={variant}
                            excerptHtml={getMyBookDetailsExcerptHtml(variant.excerptText || '')}
                            isAnswerRevealed={Boolean(revealedAnswers[variant.id])}
                            onToggleAnswers={onToggleAnswers}
                        />
                    ))}
                </section>
            ))}
        </div>
    );
}
