import { IoRefreshOutline } from 'react-icons/io5';

interface NewTestLoadingOverlayProps {
    isVisible: boolean;
    message: string;
}

export default function NewTestLoadingOverlay({
    isVisible,
    message,
}: NewTestLoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-white/45 backdrop-blur-[2px]">
            <div className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm">
                <IoRefreshOutline className="animate-spin text-base" />
                <span>{message}</span>
            </div>
        </div>
    );
}
