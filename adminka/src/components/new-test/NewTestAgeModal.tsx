import Button from '@/components/shared/Button';

interface NewTestAgeModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function NewTestAgeModal({
    isOpen,
    onCancel,
    onConfirm,
}: NewTestAgeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 no-print">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
                <h3 className="text-lg font-bold">Материал 18+</h3>
                <p className="text-sm opacity-70">
                    В выбранных материалах есть контент с отметкой 18+. Подтвердите, что вам исполнилось 18 лет.
                </p>
                <div className="flex justify-end gap-3">
                    <Button variant="outlined" onClick={onCancel}>
                        Отмена
                    </Button>
                    <Button variant="outlined" className="bg-black/5" onClick={onConfirm}>
                        Подтвердить
                    </Button>
                </div>
            </div>
        </div>
    );
}
