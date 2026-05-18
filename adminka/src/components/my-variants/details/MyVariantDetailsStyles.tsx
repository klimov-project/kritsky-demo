'use client';

export default function MyVariantDetailsStyles() {
    return (
        <style jsx global>{`
            @media print {
                .no-print { display: none !important; }
                .print-area { max-width: 100% !important; padding: 0 !important; }
                .print-part-break { break-before: page; page-break-before: always; }
                header, footer { display: none !important; }
                body { background: white; }
            }
            .rich-content { font-weight: normal; }
            .rich-content ul { list-style: disc; margin: 0.35rem 0; padding-left: 1.35rem; }
            .rich-content ol { list-style: decimal; margin: 0.35rem 0; padding-left: 1.35rem; }
            .rich-content p { margin: 0.25rem 0; }
            .rich-content * { font-size: inherit !important; font-family: inherit !important; color: inherit !important; }
            .variant-uniform :not(.no-print):not(.no-print *) { font-size: 16px !important; line-height: 1.6 !important; }
        `}</style>
    );
}
