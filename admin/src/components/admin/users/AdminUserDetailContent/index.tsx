'use client';

import Link from 'next/link';
import Button from '@/components/shared/Button';
import type { AdminUserDetailContentProps } from '@/types/ui/adminUserDetail';
import {
    ADMIN_USER_COLLECTION_CATEGORY,
    ADMIN_USER_DOWNLOAD_PACK_CATEGORY,
    getAdminUserOrderItemsByCategory,
    getTodayIsoDate,
} from '@/utils/adminUserDetail';

export default function AdminUserDetailContent({
    user,
    actionLoading,
    customDate,
    creditsInput,
    collectionsOrders,
    downloadPackOrders,
    onCustomDateChange,
    onCreditsInputChange,
    onBlockToggle,
    onGiveSubscription,
    onGiveSubscriptionUntilDate,
    onRemoveSubscription,
    onSetDownloadCredits,
}: AdminUserDetailContentProps) {

    return (
        <>
            <div className="mb-6">
                <Link href="/admin/users" className="text-sm text-[#221E20]/60 hover:text-[#221E20] transition-colors">
                    &larr; Назад к списку пользователей
                </Link>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col gap-8">
                {/* Header Information */}
                <div>
                    <h1 className="text-3xl font-serif font-bold mb-4 flex items-center gap-3">
                        {user.name || `Пользователь #${user.id}`}
                        {user.isBlocked && (
                            <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                                Заблокирован
                            </span>
                        )}
                    </h1>
                    <div className="flex flex-wrap gap-8 text-sm opacity-80">
                        <div><span className="font-bold opacity-50 uppercase text-xs block mb-1">Email</span> {user.email || '—'}</div>
                        <div><span className="font-bold opacity-50 uppercase text-xs block mb-1">Телефон</span> {user.phone || '—'}</div>
                        <div><span className="font-bold opacity-50 uppercase text-xs block mb-1">Дата регистрации</span> {user.registrationDate}</div>
                    </div>
                </div>

                {/* Actions & Stats Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Subscription Block */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col gap-4">
                        <h2 className="text-lg font-bold font-serif">Управление подпиской</h2>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="opacity-60">Статус:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                user.subscriptionStatus === 'Active' ? 'bg-green-100 text-green-700' :
                                user.subscriptionStatus === 'Expired' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
                            }`}>
                                {user.subscriptionStatus === 'Active' ? 'Активна' : user.subscriptionStatus === 'Expired' ? 'Истекла' : 'Нет'}
                            </span>
                            {user.subscriptionExpireDate && (
                                <span className="opacity-60 ml-2">До {user.subscriptionExpireDate}</span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                            <Button
                                variant="filled"
                                className="!py-2 !px-4 text-xs font-bold"
                                disabled={actionLoading}
                                onClick={() => onGiveSubscription(30)}
                            >
                                Выдать на 1 мес
                            </Button>
                            <Button
                                variant="filled"
                                className="!py-2 !px-4 text-xs font-bold"
                                disabled={actionLoading}
                                onClick={() => onGiveSubscription(90)}
                            >
                                На 3 мес
                            </Button>
                            <Button
                                variant="filled"
                                className="!py-2 !px-4 text-xs font-bold"
                                disabled={actionLoading}
                                onClick={() => onGiveSubscription(365)}
                            >
                                На год
                            </Button>
                        </div>
                        <div className="flex flex-wrap items-end gap-2 mt-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase opacity-50">До даты</label>
                                <input
                                    type="date"
                                    value={customDate}
                                    onChange={(event) => onCustomDateChange(event.target.value)}
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white"
                                    min={getTodayIsoDate()}
                                />
                            </div>
                            <Button
                                variant="filled"
                                className="!py-2 !px-4 text-xs font-bold"
                                disabled={actionLoading || !customDate}
                                onClick={onGiveSubscriptionUntilDate}
                            >
                                Выдать до даты
                            </Button>
                        </div>
                        {user.subscriptionStatus === 'Active' && (
                            <div className="mt-2">
                                <Button
                                    variant="outlined"
                                    className="!py-2 !px-4 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50"
                                    disabled={actionLoading}
                                    onClick={onRemoveSubscription}
                                >
                                    Деактивировать подписку
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stats & Moderation Block */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col gap-4">
                        <h2 className="text-lg font-bold font-serif">Активность и модерация</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div className="bg-white p-3 rounded-xl border border-gray-100">
                                <div className="text-xs uppercase opacity-50 font-bold mb-1">Сгенерировано</div>
                                <div className="text-xl font-bold">{user.variantsGeneratedTotal}</div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-100">
                                <div className="text-xs uppercase opacity-50 font-bold mb-1">Скачано / печать</div>
                                <div className="text-xl font-bold">{user.downloadsTotal}</div>
                            </div>
                        </div>

                        {/* Download Credits */}
                        <div className="bg-white p-3 rounded-xl border border-gray-100">
                            <div className="text-xs uppercase opacity-50 font-bold mb-2">Доп. варианты для скачивания</div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={creditsInput}
                                    onChange={(event) => onCreditsInputChange(event.target.value)}
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white w-24"
                                />
                                <Button
                                    variant="filled"
                                    className="!py-1.5 !px-3 text-xs font-bold"
                                    disabled={actionLoading}
                                    onClick={onSetDownloadCredits}
                                >
                                    Сохранить
                                </Button>
                            </div>
                        </div>

                        <div>
                            <Button
                                variant="outlined"
                                className={`!py-2 !px-4 text-xs font-bold w-fit ${user.isBlocked ? 'text-green-600 border-green-200 hover:bg-green-50' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
                                disabled={actionLoading}
                                onClick={onBlockToggle}
                            >
                                {user.isBlocked ? 'Разблокировать пользователя' : 'Заблокировать пользователя'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Saved Variants */}
                <div>
                    <h2 className="text-2xl font-serif font-bold mb-4">Сохранённые варианты</h2>
                    {user.savedVariants && user.savedVariants.length > 0 ? (
                        <div className="border border-gray-100 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase opacity-70">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">ID</th>
                                        <th className="px-6 py-4 font-bold">Дата</th>
                                        <th className="px-6 py-4 font-bold">Отрывок</th>
                                        <th className="px-6 py-4 font-bold">Стихотворение</th>
                                        <th className="px-6 py-4 font-bold">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {user.savedVariants.map((v) => (
                                        <tr key={v.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50">
                                            <td className="px-6 py-4 font-bold text-gray-400">#{v.id}</td>
                                            <td className="px-6 py-4">{v.date}</td>
                                            <td className="px-6 py-4">{v.excerptTitle}</td>
                                            <td className="px-6 py-4">{v.poemTitle}</td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <Link
                                                    href={`/admin/users/variants/${v.id}`}
                                                    className="font-bold text-blue-600 hover:underline text-xs"
                                                >
                                                    Просмотр
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-sm opacity-60 bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                            Пользователь пока не сохранил ни одного варианта.
                        </div>
                    )}
                </div>

                {/* Variant Exports (Downloads / Prints) */}
                <div>
                    <h2 className="text-2xl font-serif font-bold mb-4">Скачанные / распечатанные варианты</h2>
                    {user.variantExports && user.variantExports.length > 0 ? (
                        <div className="border border-gray-100 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase opacity-70">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Дата</th>
                                        <th className="px-6 py-4 font-bold">Действие</th>
                                        <th className="px-6 py-4 font-bold">Вариант</th>
                                        <th className="px-6 py-4 font-bold">Отрывок</th>
                                        <th className="px-6 py-4 font-bold">Стихотворение</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {user.variantExports.map((exp) => (
                                        <tr key={exp.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50">
                                            <td className="px-6 py-4">{exp.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    exp.action === 'print' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {exp.action === 'print' ? 'Печать' : 'Скачивание'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {exp.savedVariantId ? (
                                                    <Link
                                                        href={`/admin/users/variants/${exp.savedVariantId}`}
                                                        className="font-bold text-blue-600 hover:underline"
                                                    >
                                                        #{exp.savedVariantId}
                                                    </Link>
                                                ) : (
                                                    <span className="opacity-40">без варианта</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">{exp.excerptTitle}</td>
                                            <td className="px-6 py-4">{exp.poemTitle}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-sm opacity-60 bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                            Пользователь пока не скачивал и не печатал варианты.
                        </div>
                    )}
                </div>

                {/* Purchased Collections */}
                <div>
                    <h2 className="text-2xl font-serif font-bold mb-4">Купленные сборники</h2>
                    {collectionsOrders.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {collectionsOrders.map((order) => (
                                <div key={order.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                    <div className="flex items-center gap-4 mb-3 text-sm">
                                        <span className="font-bold">Заказ #{order.id}</span>
                                        <span className="opacity-50">{order.date}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            order.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                        <span className="font-bold ml-auto">{order.totalAmount} &#8381;</span>
                                    </div>
                                    {getAdminUserOrderItemsByCategory(order, ADMIN_USER_COLLECTION_CATEGORY).map((item) => (
                                        <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-100 mb-2 last:mb-0">
                                            <div className="font-bold text-sm mb-1">{item.title}</div>
                                            {item.collectionConfig && (
                                                <div className="text-xs opacity-60 flex flex-wrap gap-4">
                                                    {item.collectionConfig.authorName && (
                                                        <span>Автор: {item.collectionConfig.authorName}</span>
                                                    )}
                                                    {item.collectionConfig.variantsCount && (
                                                        <span>Вариантов: {item.collectionConfig.variantsCount}</span>
                                                    )}
                                                    {item.collectionConfig.collectionKind && (
                                                        <span>Тип: {item.collectionConfig.collectionKind}</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="text-xs opacity-50 mt-1">
                                                {item.quantity} шт. x {item.unitPrice} &#8381;
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm opacity-60 bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                            Нет купленных сборников.
                        </div>
                    )}
                </div>

                {/* Download Packs */}
                {downloadPackOrders.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-serif font-bold mb-4">Купленные пакеты скачивания</h2>
                        <div className="flex flex-col gap-4">
                            {downloadPackOrders.map((order) => (
                                <div key={order.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                    <div className="flex items-center gap-4 mb-3 text-sm">
                                        <span className="font-bold">Заказ #{order.id}</span>
                                        <span className="opacity-50">{order.date}</span>
                                        <span className="font-bold ml-auto">{order.totalAmount} &#8381;</span>
                                    </div>
                                    {getAdminUserOrderItemsByCategory(order, ADMIN_USER_DOWNLOAD_PACK_CATEGORY).map((item) => (
                                        <div key={item.id} className="bg-white rounded-xl p-4 border border-gray-100 mb-2 last:mb-0">
                                            <div className="font-bold text-sm">{item.title}</div>
                                            {item.downloadPackConfig?.downloadsCount && (
                                                <div className="text-xs opacity-60 mt-1">
                                                    Скачиваний: {item.downloadPackConfig.downloadsCount}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
