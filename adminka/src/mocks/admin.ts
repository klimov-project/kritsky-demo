export type AdminSubscriptionStatus = 'Active' | 'Expired' | 'None';
export type AdminPaymentStatus = 'Success' | 'Pending' | 'Failed';
export type AdminOrderStatus = 'New' | 'Paid' | 'Delivered' | 'Cancelled';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    phone: string;
    registrationDate: string;
    subscriptionStatus: AdminSubscriptionStatus;
    variantsGeneratedTotal: number;
    downloadsTotal: number;
    weeklyGenerated: number;
    weeklyDownloaded: number;
}

export interface AdminPayment {
    id: string;
    userId: number;
    userName: string;
    amount: number;
    status: AdminPaymentStatus;
    date: string;
    method: string;
}

export interface AdminOrder {
    id: string;
    userName: string;
    items: string;
    total: number;
    status: AdminOrderStatus;
    date: string;
}

export const ADMIN_USERS: AdminUser[] = [
    { id: 1, name: 'Роман Крицкий', email: 'roman@example.com', phone: '+7 900 123 45 67', registrationDate: '2025-01-10', subscriptionStatus: 'Active', variantsGeneratedTotal: 230, downloadsTotal: 145, weeklyGenerated: 19, weeklyDownloaded: 11 },
    { id: 2, name: 'Иван Иванов', email: 'ivan@mail.ru', phone: '+7 911 222 33 44', registrationDate: '2025-01-15', subscriptionStatus: 'Expired', variantsGeneratedTotal: 128, downloadsTotal: 77, weeklyGenerated: 5, weeklyDownloaded: 2 },
    { id: 3, name: 'Анна Петрова', email: 'anna@gmail.com', phone: '+7 922 555 66 77', registrationDate: '2025-02-01', subscriptionStatus: 'None', variantsGeneratedTotal: 21, downloadsTotal: 9, weeklyGenerated: 1, weeklyDownloaded: 0 },
    { id: 4, name: 'Дмитрий Соколов', email: 'dima@test.it', phone: '+7 999 888 77 66', registrationDate: '2025-02-02', subscriptionStatus: 'Active', variantsGeneratedTotal: 64, downloadsTotal: 31, weeklyGenerated: 7, weeklyDownloaded: 4 },
    { id: 5, name: 'Мария Смирнова', email: 'maria@mail.ru', phone: '+7 901 100 10 10', registrationDate: '2025-02-05', subscriptionStatus: 'Active', variantsGeneratedTotal: 89, downloadsTotal: 56, weeklyGenerated: 12, weeklyDownloaded: 9 },
    { id: 6, name: 'Павел Орлов', email: 'p.orlov@mail.ru', phone: '+7 902 200 20 20', registrationDate: '2025-02-07', subscriptionStatus: 'Active', variantsGeneratedTotal: 41, downloadsTotal: 19, weeklyGenerated: 4, weeklyDownloaded: 2 },
    { id: 7, name: 'Елена Горина', email: 'elena@edu.ru', phone: '+7 903 300 30 30', registrationDate: '2025-02-11', subscriptionStatus: 'Expired', variantsGeneratedTotal: 73, downloadsTotal: 44, weeklyGenerated: 3, weeklyDownloaded: 1 },
    { id: 8, name: 'Никита Лебедев', email: 'nikita@study.ru', phone: '+7 904 400 40 40', registrationDate: '2025-02-13', subscriptionStatus: 'Active', variantsGeneratedTotal: 152, downloadsTotal: 98, weeklyGenerated: 16, weeklyDownloaded: 13 },
    { id: 9, name: 'Ольга Назарова', email: 'olga@nazarova.ru', phone: '+7 905 500 50 50', registrationDate: '2025-02-14', subscriptionStatus: 'None', variantsGeneratedTotal: 12, downloadsTotal: 4, weeklyGenerated: 0, weeklyDownloaded: 0 },
    { id: 10, name: 'Кирилл Белов', email: 'k.belov@mail.ru', phone: '+7 906 600 60 60', registrationDate: '2025-02-16', subscriptionStatus: 'Active', variantsGeneratedTotal: 94, downloadsTotal: 66, weeklyGenerated: 10, weeklyDownloaded: 8 },
    { id: 11, name: 'Светлана Колесова', email: 's.kolesova@mail.ru', phone: '+7 907 700 70 70', registrationDate: '2025-02-18', subscriptionStatus: 'Expired', variantsGeneratedTotal: 52, downloadsTotal: 24, weeklyGenerated: 2, weeklyDownloaded: 1 },
    { id: 12, name: 'Илья Кузнецов', email: 'ilya@school.ru', phone: '+7 908 800 80 80', registrationDate: '2025-02-21', subscriptionStatus: 'Active', variantsGeneratedTotal: 117, downloadsTotal: 83, weeklyGenerated: 9, weeklyDownloaded: 6 },
];

export const ADMIN_PAYMENTS: AdminPayment[] = [
    { id: 'pay_001', userId: 1, userName: 'Роман Крицкий', amount: 990, status: 'Success', date: '2025-02-01 14:20', method: 'Карта' },
    { id: 'pay_002', userId: 2, userName: 'Иван Иванов', amount: 500, status: 'Success', date: '2025-02-02 09:12', method: 'SberPay' },
    { id: 'pay_003', userId: 3, userName: 'Анна Петрова', amount: 1500, status: 'Pending', date: '2025-02-03 18:05', method: 'Карта' },
    { id: 'pay_004', userId: 4, userName: 'Дмитрий Соколов', amount: 490, status: 'Success', date: '2025-02-04 11:45', method: 'SBP' },
    { id: 'pay_005', userId: 5, userName: 'Мария Смирнова', amount: 490, status: 'Success', date: '2025-02-05 13:10', method: 'Карта' },
    { id: 'pay_006', userId: 6, userName: 'Павел Орлов', amount: 1990, status: 'Success', date: '2025-02-06 16:28', method: 'Карта' },
    { id: 'pay_007', userId: 7, userName: 'Елена Горина', amount: 490, status: 'Failed', date: '2025-02-07 08:22', method: 'Карта' },
    { id: 'pay_008', userId: 8, userName: 'Никита Лебедев', amount: 990, status: 'Success', date: '2025-02-08 21:15', method: 'SberPay' },
    { id: 'pay_009', userId: 10, userName: 'Кирилл Белов', amount: 790, status: 'Success', date: '2025-02-09 09:02', method: 'Карта' },
    { id: 'pay_010', userId: 12, userName: 'Илья Кузнецов', amount: 490, status: 'Success', date: '2025-02-10 12:17', method: 'SBP' },
];

export const ADMIN_ORDERS: AdminOrder[] = [
    { id: 'ord_123', userName: 'Роман Крицкий', items: 'Евгений Онегин. Энциклопедия романа', total: 1290, status: 'Paid', date: '2025-02-01' },
    { id: 'ord_124', userName: 'Иван Иванов', items: 'Плакат «Литературные направления»', total: 790, status: 'New', date: '2025-02-02' },
    { id: 'ord_125', userName: 'Анна Петрова', items: 'Разбор сложных сочинений 11.1–11.5', total: 890, status: 'Cancelled', date: '2025-02-03' },
    { id: 'ord_126', userName: 'Дмитрий Соколов', items: 'Рандомный сборник вариантов ЕГЭ', total: 1990, status: 'Paid', date: '2025-02-04' },
    { id: 'ord_127', userName: 'Мария Смирнова', items: 'Набор стикеров «Лит-коды»', total: 290, status: 'Delivered', date: '2025-02-05' },
    { id: 'ord_128', userName: 'Павел Орлов', items: 'Фигурка «Пушкин»', total: 1590, status: 'Paid', date: '2025-02-06' },
    { id: 'ord_129', userName: 'Никита Лебедев', items: 'Цифровой плакат «Тропы и фигуры»', total: 390, status: 'Delivered', date: '2025-02-07' },
];

export const ADMIN_DASHBOARD_STATS = {
    subscriptionsCount: ADMIN_USERS.filter((user) => user.subscriptionStatus === 'Active').length,
    usersCount: ADMIN_USERS.length,
    generatedVariantsCount: ADMIN_USERS.reduce((sum, user) => sum + user.variantsGeneratedTotal, 0),
    downloadedVariantsCount: ADMIN_USERS.reduce((sum, user) => sum + user.downloadsTotal, 0),
    totalEarned: ADMIN_PAYMENTS
        .filter((payment) => payment.status === 'Success')
        .reduce((sum, payment) => sum + payment.amount, 0),
};
