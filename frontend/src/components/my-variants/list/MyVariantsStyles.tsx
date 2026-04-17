'use client';

export default function MyVariantsStyles() {
    return (
        <style jsx global>{`
            .rich-content { font-weight: normal; }
            .rich-content ul { list-style: disc; margin: 0.35rem 0; padding-left: 1.35rem; }
            .rich-content ol { list-style: decimal; margin: 0.35rem 0; padding-left: 1.35rem; }
            .rich-content p { margin: 0.25rem 0; }
            .rich-content * { font-size: inherit !important; font-family: inherit !important; color: inherit !important; }
        `}</style>
    );
}
