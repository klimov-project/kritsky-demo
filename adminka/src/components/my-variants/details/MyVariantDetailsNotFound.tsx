'use client';

import Link from 'next/link';

import Button from '@/components/shared/Button';
import type { MyVariantDetailsNotFoundProps } from '@/types/ui/myVariantDetails';

export default function MyVariantDetailsNotFound({
    error,
    onGoToVariants,
    onGoToGenerator,
}: MyVariantDetailsNotFoundProps) {
    return (
        <div className="w-full max-w-[900px] mx-auto px-4 md:px-0 pt-[90px] pb-20">
            <Link href="/my-variants" className="text-sm text-[#221E20]/60 hover:text-[#221E20] transition-colors">
                ← Назад к списку вариантов
            </Link>

            <div className="mt-6 border border-[#221E20]/10 rounded-xl p-8 bg-white space-y-4">
                <h1 className="font-serif text-3xl font-bold text-[#221E20]">Вариант не найден</h1>
                <p className="text-[#221E20]/60">
                    {error || 'Этот сохранённый вариант не найден в базе данных.'}
                </p>
                <div className="flex gap-3">
                    <Button variant="outlined" onClick={onGoToVariants}>
                        К моим вариантам
                    </Button>
                    <Button variant="outlined" onClick={onGoToGenerator}>
                        Открыть генератор
                    </Button>
                </div>
            </div>
        </div>
    );
}
