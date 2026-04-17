import Link from 'next/link';
import PageLayout from '@/components/layout/PageLayout';

export default function NotFound() {
    return (
        <PageLayout>
            <section className="flex-1 py-[90px] md:py-[120px] flex items-center">
                <div className="w-full">
                    <div className="relative overflow-hidden rounded-2xl border border-[#221E20]/10 bg-[#F9F6F3] px-6 py-10 md:px-12 md:py-14">
                        <div className="absolute -top-16 -right-20 h-56 w-56 rounded-full bg-[#F2D2C3]/70 blur-2xl" />
                        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[#EDE5DA]/80 blur-2xl" />

                        <div className="relative max-w-2xl space-y-5 font-serif text-[#221E20]">
                            <span className="inline-flex w-fit rounded-full border border-[#221E20]/15 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.18em]">
                                Ошибка 404
                            </span>

                            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                                Страница не найдена
                            </h1>

                            <p className="text-sm md:text-base opacity-70 leading-relaxed">
                                Такой страницы нет или ссылка устарела. Вы можете вернуться на главную
                                страницу или перейти к генерации варианта.
                            </p>

                            <div className="flex flex-wrap gap-3 pt-2">
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center rounded-xl border border-[#221E20] bg-[#221E20] px-5 py-2.5 text-sm text-white transition-opacity hover:opacity-90"
                                >
                                    На главную
                                </Link>
                                <Link
                                    href="/new_test"
                                    className="inline-flex items-center justify-center rounded-xl border border-[#221E20]/25 bg-white px-5 py-2.5 text-sm transition-colors hover:bg-[#221E20]/5"
                                >
                                    Собрать вариант
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
