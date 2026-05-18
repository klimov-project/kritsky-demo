interface NewTestBlockedOverlayProps {
    supportEmail: string;
}

export default function NewTestBlockedOverlay({ supportEmail }: NewTestBlockedOverlayProps) {
    return (
        <div className="fixed inset-0 bg-white z-9999 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-6">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-3xl font-bold text-red-600">Ваш аккаунт заблокирован</h1>
                <p className="text-lg text-gray-600">
                    Доступ к конструктору ограничен администратором. Если вы считаете, что это ошибка, обратитесь в поддержку к админу по почте {supportEmail}.
                </p>
            </div>
        </div>
    );
}
