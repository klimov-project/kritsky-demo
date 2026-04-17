from __future__ import annotations

from pydantic import BaseModel


class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    registrationDate: str
    subscriptionStatus: str
    variantsGeneratedTotal: int
    downloadsTotal: int
    weeklyGenerated: int
    weeklyDownloaded: int
    isBlocked: bool


class AdminUsersListResponse(BaseModel):
    items: list[AdminUserResponse]


class AdminPaymentResponse(BaseModel):
    id: str
    userId: int
    userName: str
    amount: float
    status: str
    date: str
    method: str


class AdminPaymentsListResponse(BaseModel):
    items: list[AdminPaymentResponse]


class AdminOrderResponse(BaseModel):
    id: str
    userName: str
    items: str
    total: float
    status: str
    date: str


class AdminOrdersListResponse(BaseModel):
    items: list[AdminOrderResponse]


class AdminDashboardResponse(BaseModel):
    subscriptionsCount: int
    usersCount: int
    generatedVariantsCount: int
    downloadedVariantsCount: int
    totalEarned: float
    ordersCount: int
    paymentsCount: int


class AdminUserSavedVariantResponse(BaseModel):
    id: int
    date: str
    excerptTitle: str
    poemTitle: str


class AdminUserOrderItemResponse(BaseModel):
    id: int
    title: str
    category: str | None
    quantity: int
    unitPrice: float
    collectionConfig: dict | None
    downloadPackConfig: dict | None


class AdminUserOrderResponse(BaseModel):
    id: int
    date: str
    status: str
    totalAmount: float
    items: list[AdminUserOrderItemResponse]


class AdminUserExportResponse(BaseModel):
    id: int
    date: str
    action: str
    savedVariantId: int | None
    excerptTitle: str
    poemTitle: str


class AdminUserDetailResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    registrationDate: str
    subscriptionStatus: str
    subscriptionExpireDate: str | None
    variantsGeneratedTotal: int
    downloadsTotal: int
    paidDownloadCredits: int
    isBlocked: bool
    savedVariants: list[AdminUserSavedVariantResponse]
    variantExports: list[AdminUserExportResponse]
    orders: list[AdminUserOrderResponse]


class AdminBlockUserRequest(BaseModel):
    block: bool


class AdminSubscriptionRequest(BaseModel):
    days: int


class AdminDownloadCreditsRequest(BaseModel):
    credits: int
