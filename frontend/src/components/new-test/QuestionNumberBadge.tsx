import type { QuestionNumberBadgeProps } from '@/types/ui/newTestPage';

export default function QuestionNumberBadge({ label }: QuestionNumberBadgeProps) {
    return (
        <span className="inline-flex shrink-0 items-center justify-center border border-gray-500 px-3 py-[2px] text-sm font-bold leading-none">
            {label}
        </span>
    );
}
