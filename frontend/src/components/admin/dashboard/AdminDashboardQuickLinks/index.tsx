'use client';

import Link from 'next/link';

import type { AdminDashboardQuickLinksProps } from '@/types/ui/adminDashboard';

export default function AdminDashboardQuickLinks({ links }: AdminDashboardQuickLinksProps) {
    return (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className="bg-white border border-gray-100 rounded-xl p-5 hover:border-[#221E20]/20 transition-colors"
                >
                    <p className="font-bold">{link.title}</p>
                    <p className="text-sm opacity-60 mt-1">{link.description}</p>
                </Link>
            ))}
        </div>
    );
}
