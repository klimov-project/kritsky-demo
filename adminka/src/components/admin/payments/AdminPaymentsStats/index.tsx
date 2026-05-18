'use client';

import {
    IoCardOutline,
    IoFlashOutline,
    IoTrendingUpOutline,
    IoWalletOutline,
} from 'react-icons/io5';

import type { AdminPaymentsStatsProps } from '@/types/ui/adminPayments';

const ICON_BY_KEY = {
    income: <IoTrendingUpOutline size={24} className="text-green-600" />,
    subscriptions: <IoFlashOutline size={24} className="text-yellow-600" />,
    transactions: <IoCardOutline size={24} className="text-blue-600" />,
    totalEarned: <IoWalletOutline size={24} className="text-[#221E20]" />,
};

export default function AdminPaymentsStats({ cards }: AdminPaymentsStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            {cards.map((item) => (
                <div
                    key={item.label}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
                >
                    <div>
                        <p className="text-gray-500 text-sm mb-1">{item.label}</p>
                        <p className="text-2xl font-bold text-[#221E20]">{item.value}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">{ICON_BY_KEY[item.iconKey]}</div>
                </div>
            ))}
        </div>
    );
}
