export default function NewTestGlobalStyles() {
    return (
        <style jsx global>{`
            @media print {
                .no-print { display: none !important; }
                .print-area { max-width: 100% !important; padding: 0 !important; }
                .print-part-break { break-before: page; page-break-before: always; }
                .print-page-break { break-before: page; page-break-before: always; }
                header, footer { display: none !important; }
                body { background: white; }
                .test-page-with-bg::before { display: none !important; }
                .variant-uniform :not(.no-print):not(.no-print *) {
                    font-size: 14px !important;
                    line-height: 1.45 !important;
                }
                .variant-copy p,
                .variant-copy li {
                    break-inside: avoid-page;
                    page-break-inside: avoid;
                }
                .collapsible-instruction-content {
                    max-height: none !important;
                    overflow: visible !important;
                }
                .test-content-surface {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .test-content-surface::before {
                    background-repeat: repeat-y !important;
                    background-position: center top !important;
                    background-size: 100% auto !important;
                    background-attachment: scroll !important;
                    opacity: 0.07 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
            .rich-content { font-weight: normal; }
            .rich-content ul { list-style: disc; margin: 0.35rem 0; padding-left: 1.35rem; }
            .rich-content ol { list-style: decimal; margin: 0.35rem 0; padding-left: 1.35rem; }
            .rich-content p { margin: 0.25rem 0; }
            .rich-content * { font-size: inherit !important; font-family: inherit !important; color: inherit !important; }
            .variant-uniform :not(.no-print):not(.no-print *) { font-size: 16px !important; line-height: 1.6 !important; }
            .variant-copy,
            .variant-copy p,
            .variant-copy li,
            .variant-copy blockquote { text-align: justify; text-justify: inter-word; }
            .test-page-with-bg {
                position: relative;
                isolation: isolate;
                background: #f6f6f6;
            }
            .test-page-with-bg::before {
                content: '';
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 0;
                background-image: url('/test_back.png');
                background-repeat: no-repeat;
                background-position: center top;
                background-size: cover;
                opacity: 0.12;
            }
            .test-page-with-bg > * {
                position: relative;
                z-index: 1;
            }
            .test-content-surface {
                position: relative;
                isolation: isolate;
                overflow: visible;
                background: transparent;
                max-width: 954px;
            }
            .test-content-surface::before {
                content: '';
                position: absolute;
                inset: 0;
                pointer-events: none;
                z-index: 0;
            }
            .test-content-surface > * {
                position: relative;
                z-index: 1;
            }
            @keyframes sceneFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .scene-animate {
                animation: sceneFadeIn 0.35s ease-out forwards;
            }
            .new-test-title-lines > span {
                display: block;
                width: 96px;
                height: 1px;
                background: rgba(34, 30, 32, 0.5);
            }
            .new-test-answer-grid {
                display: grid;
                grid-template-columns: repeat(var(--columns, 3), minmax(46px, 1fr));
                border-left: 1px solid #6b7280;
                border-top: 1px solid #6b7280;
            }
            .new-test-answer-cell {
                border-right: 1px solid #6b7280;
                border-bottom: 1px solid #6b7280;
                text-align: center;
                min-height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .new-test-divider {
                width: min(340px, 100%);
                height: 1px;
                background: rgba(107, 114, 128, 0.65);
                margin: 30px auto;
            }
        `}</style>
    );
}
