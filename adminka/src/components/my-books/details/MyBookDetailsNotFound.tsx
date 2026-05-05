'use client';

import Link from 'next/link';

import Button from '@/components/shared/Button';
import type { MyBookDetailsNotFoundProps } from '@/types/ui/myBookDetails';

export default function MyBookDetailsNotFound({ error, onGoToMyBooks }: MyBookDetailsNotFoundProps) {
    return (
        <div className="w-full max-w-[980px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
            <Link href="/my-books" className="text-sm text-[#221E20]/60 hover:text-[#221E20] transition-colors">
                ← Назад к покупкам
            </Link>

            <div className="mt-6 border border-[#221E20]/10 rounded-xl p-8 bg-white space-y-4">
                <h1 className="font-serif text-3xl font-bold text-[#221E20]">Покупка не найдена</h1>
                <p className="text-[#221E20]/60">{error || 'Запись о покупке отсутствует.'}</p>
                <Button variant="outlined" onClick={onGoToMyBooks}>
                    К списку покупок
                </Button>
            </div>
        </div>
    );
}
