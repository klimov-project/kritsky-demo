import type { Metadata } from 'next';

import HomePageContent from '@/components/home/HomePageContent';
import type { HomePageProps } from '@/types/ui/home';

export const metadata: Metadata = {
    title: 'Крицкий - подготовка к ЕГЭ',
    description:
        'Крицкий - собери свой вариант для подготовки к ЕГЭ.',
};

export default async function HomePage({ searchParams }: HomePageProps) {
    const params = await searchParams;
    const initialDate = typeof params?.date === 'string' ? params.date : undefined;

    return <HomePageContent initialDate={initialDate} />;
}
