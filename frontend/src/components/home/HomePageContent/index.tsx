'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/shared/Button';
import { fetchKnowledgeBase } from '@/lib/knowledgeBaseApi';
import { calculateVariantStats } from '@/lib/variantStats';

interface HomePageContentProps {
    initialDate?: string;
}

export default function HomePageContent({ initialDate }: HomePageContentProps) {
    const router = useRouter();
    const [variantCountLabel, setVariantCountLabel] = useState<string>('');

    const handleScrollToParams = () => {
        router.push(initialDate ? `/new_test?date=${encodeURIComponent(initialDate)}` : '/new_test');
    };

    useEffect(() => {
        let cancelled = false;

        const loadVariantStats = async () => {
            try {
                const knowledgeBase = await fetchKnowledgeBase();
                if (!cancelled) {
                    setVariantCountLabel(calculateVariantStats(knowledgeBase).totalVariantsLabel);
                }
            } catch {
                if (!cancelled) {
                    setVariantCountLabel('');
                }
            }
        };

        void loadVariantStats();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="flex flex-col w-full">
            <section
                className="w-full flex flex-col items-center justify-center relative"
                style={{ minHeight: 'calc(100vh - 70px)' }}
            >
                <div className="relative z-10 w-full max-w-[1050px] bg-white/35 backdrop-blur-[2px] rounded-[16px] border border-[#221E20]/8 px-[25px] py-[40px] flex flex-col items-center">
                    <h1 className="text-[#221E20] font-serif text-2xl lg:text-3xl font-bold text-center">
                        КРИЦКИЙ
                    </h1>
                    <p className="mt-4 max-w-[760px] text-center text-[#221E20]/75 font-serif text-base leading-relaxed">
                        Платформа для подготовки к ЕГЭ по литературе: здесь можно собрать вариант по заданным параметрам,
                        работать с готовыми материалами и вести подготовку в удобном формате.
                    </p>

                    <div className="mt-[40px] flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <div onClick={handleScrollToParams}>
                            <Button variant="filled" paddingX={32} paddingY={12} fontSize={18} fontWeight="bold">
                                Создать вариант
                            </Button>
                        </div>
                        {variantCountLabel ? (
                            <div className="rounded-full border border-[#221E20]/15 bg-white/70 px-4 py-2 text-sm font-semibold text-[#221E20]/75">
                                Сейчас доступно {variantCountLabel} вариантов
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>
        </div>
    );
}
