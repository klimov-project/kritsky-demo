'use client';

import {
    IoCloudDownloadOutline,
    IoDocumentTextOutline,
    IoFlashOutline,
    IoPeopleOutline,
} from 'react-icons/io5';

import type { AdminDashboardMetricsProps } from '@/types/ui/adminDashboard';

const ICON_BY_KEY = {
    subscriptions: <IoFlashOutline size={24} className="text-yellow-600" />,
    users: <IoPeopleOutline size={24} className="text-blue-600" />,
    generated: <IoDocumentTextOutline size={24} className="text-[#221E20]" />,
    downloads: <IoCloudDownloadOutline size={24} className="text-green-600" />,
};

export default function AdminDashboardMetrics({ cards }: AdminDashboardMetricsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
                >
                    <div>
                        <p className="text-gray-500 text-sm mb-1">{card.title}</p>
                        <p className="text-3xl font-bold text-[#221E20]">{card.value}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">{ICON_BY_KEY[card.iconKey]}</div>
                </div>
            ))}
        </div>
    );
}
