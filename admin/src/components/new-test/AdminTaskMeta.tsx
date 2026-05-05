import { IoPin, IoPinOutline } from 'react-icons/io5';
import type { AdminTaskMetaProps } from '@/types/ui/newTestPage';
import { getRodLabel, getTagsList } from '@/utils/newTestPage';
import AdminIdBadge from '@/components/new-test/AdminIdBadge';

export default function AdminTaskMeta({
    task,
    showRod = false,
    taskKey,
    pinned,
    pinConflict,
    onPin,
    onUnpin,
    onSelect,
}: AdminTaskMetaProps) {
    if (!task) return null;

    const rodLabel = showRod ? getRodLabel(task.rodId) : null;
    const authorId = task.authorId;
    const authorIds = task.authorIds;
    const tags = getTagsList(task);
    const isSpecial = task.special === true;
    const showPinControls = Boolean(taskKey && (onPin || onUnpin));

    return (
        <div className="no-print mt-1 flex flex-wrap items-center gap-1">
            <AdminIdBadge id={task.id} />
            {rodLabel && (
                <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-sans">
                    род: {rodLabel}
                </span>
            )}
            {isSpecial && (
                <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-sans">
                    исключительный
                </span>
            )}
            {(authorId || authorIds) && (
                <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-sans">
                    автор: {authorIds ? (Array.isArray(authorIds) ? authorIds.join(', ') : authorIds) : authorId}
                </span>
            )}
            {tags.map((tag, index) => (
                <span key={`${tag}-${index}`} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-sans">
                    {tag}
                </span>
            ))}
            {showPinControls && (
                pinned ? (
                    <button
                        type="button"
                        onClick={onUnpin}
                        title="Открепить задание"
                        className="inline-flex items-center gap-0.5 text-[10px] bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded font-sans hover:bg-orange-100 transition-colors cursor-pointer"
                    >
                        <IoPin className="w-2.5 h-2.5" />
                        закреплено
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={pinConflict ? undefined : onPin}
                        disabled={Boolean(pinConflict)}
                        title={pinConflict ?? 'Закрепить задание (останется при обновлении)'}
                        className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-sans border transition-colors ${
                            pinConflict
                                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer'
                        }`}
                    >
                        <IoPinOutline className="w-2.5 h-2.5" />
                        закрепить
                    </button>
                )
            )}
            {onSelect && (
                <button
                    type="button"
                    onClick={onSelect}
                    title="Выбрать задание по ID"
                    className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-sans border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                    выбрать
                </button>
            )}
        </div>
    );
}
