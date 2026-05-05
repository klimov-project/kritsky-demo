import type { AdminIdBadgeProps } from '@/types/ui/newTestPage';

export default function AdminIdBadge({ id, extra }: AdminIdBadgeProps) {
    const parts: string[] = [];
    if (id) parts.push(`#${id}`);
    if (extra) parts.push(extra);
    if (!parts.length) return null;

    return (
        <span className="ml-1 text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded no-print">
            {parts.join(' ')}
        </span>
    );
}
