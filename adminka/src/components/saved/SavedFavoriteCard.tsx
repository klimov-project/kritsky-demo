'use client';

import Button from '@/components/shared/Button';
import type { SavedFavoriteCardProps } from '@/types/ui/savedPage';

export default function SavedFavoriteCard({ item, onOpenProduct }: SavedFavoriteCardProps) {
    return (
        <article className="bg-white border border-[#221E20]/10 rounded-xl p-5 flex flex-col gap-4">
            <div className="h-[200px] bg-gray-100 rounded overflow-hidden flex items-center justify-center text-xs opacity-40 uppercase tracking-widest">
                {item.coverUrl ? (
                    <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                    'Обложка'
                )}
            </div>

            <div>
                <h2 className="font-serif font-bold text-lg leading-tight text-[#221E20]">{item.title}</h2>
                <p className="text-sm text-[#221E20]/65 mt-2">{item.author}</p>
            </div>

            <Button
                variant="outlined"
                className="mt-auto"
                onClick={() => onOpenProduct(item.id)}
            >
                Открыть товар
            </Button>
        </article>
    );
}
