import Button from '@/components/shared/Button';
import Popup from '@/components/shared/Popup';
import type {
    NewTestSelectModalSetter,
    NewTestSelectModalState,
} from '@/types/ui/newTestPage';

interface NewTestTaskSelectPopupProps {
    modal: NewTestSelectModalState | null;
    setModal: NewTestSelectModalSetter;
    onClose: () => void;
    onConfirm: () => void;
}

export default function NewTestTaskSelectPopup({
    modal,
    setModal,
    onClose,
    onConfirm,
}: NewTestTaskSelectPopupProps) {
    return (
        <Popup
            isOpen={modal !== null}
            onClose={onClose}
            title={`Выбрать задание — ${modal?.taskKey ?? ''}`}
            size="small"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="outlined" onClick={onClose}>Отмена</Button>
                    <Button variant="filled" onClick={onConfirm}>Применить</Button>
                </div>
            }
        >
            {(() => {
                const isTwoGap = modal?.taskKey === 'task3' || modal?.taskKey === 'task6';

                return (
                    <div className="space-y-3">
                        <label className="block text-sm text-gray-700">
                            {isTwoGap ? 'ID первого предложения:' : 'Введите внутренний ID задания:'}
                        </label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Например: 42"
                            value={modal?.inputValue ?? ''}
                            onChange={(event) => setModal((prev) => (
                                prev ? { ...prev, inputValue: event.target.value, error: '' } : null
                            ))}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !isTwoGap) onConfirm();
                            }}
                            autoFocus
                        />
                        {isTwoGap && (
                            <>
                                <label className="block text-sm text-gray-700">
                                    ID второго предложения <span className="text-gray-400">(опционально — для связки двух)</span>:
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Например: 99 (или оставьте пустым)"
                                    value={modal?.inputValue2 ?? ''}
                                    onChange={(event) => setModal((prev) => (
                                        prev ? { ...prev, inputValue2: event.target.value, error: '' } : null
                                    ))}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') onConfirm();
                                    }}
                                />
                            </>
                        )}
                        {modal?.error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {modal.error}
                            </div>
                        )}
                    </div>
                );
            })()}
        </Popup>
    );
}
