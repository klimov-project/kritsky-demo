'use client';

import React, { useEffect, useState } from 'react';

import Button from '@/components/shared/Button';
import Checkbox from '@/components/shared/Checkbox';
import Input from '@/components/shared/Input';
import Popup from '@/components/shared/Popup';
import Textarea from '@/components/shared/Textarea';

interface FeedbackPopupProps {
    isOpen: boolean;
    onClose: () => void;
    defaultName?: string;
    defaultEmail?: string;
    onSubmit?: (payload: { name: string; email: string; comment: string }) => void | Promise<void>;
}

export default function FeedbackPopup({
    isOpen,
    onClose,
    defaultName = '',
    defaultEmail = '',
    onSubmit,
}: FeedbackPopupProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [name, setName] = useState(defaultName);
    const [email, setEmail] = useState(defaultEmail);
    const [comment, setComment] = useState('');
    const [isPolicyAccepted, setIsPolicyAccepted] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsSubmitted(false);
            setName(defaultName);
            setEmail(defaultEmail);
            setComment('');
            setIsPolicyAccepted(false);
            setIsSending(false);
            return;
        }

        setName(defaultName);
        setEmail(defaultEmail);
    }, [defaultEmail, defaultName, isOpen]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!name.trim() || !email.trim() || !isPolicyAccepted || isSending) return;

        setIsSending(true);
        try {
            await onSubmit?.({
                name: name.trim(),
                email: email.trim(),
                comment: comment.trim(),
            });
            setIsSubmitted(true);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Popup
            isOpen={isOpen}
            onClose={onClose}
            title="Обратная связь"
            size="medium"
        >
            {isSubmitted ? (
                <div className="py-8 text-center">
                    <p className="font-serif text-2xl font-bold text-[#221E20]">Спасибо, мы получили вашу заявку.</p>
                    <p className="text-sm text-[#221E20]/60 mt-3">Свяжемся с вами в ближайшее время.</p>
                    <Button variant="filled" className="mt-6" onClick={onClose}>Закрыть</Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Ваше имя"
                        width="full"
                        placeholder="Иван Иванов"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />
                    <Input
                        label="E-mail"
                        width="full"
                        placeholder="example@mail.com"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                    <Textarea
                        label="Комментарий"
                        width="full"
                        placeholder="Ваш комментарий"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                    />

                    <Checkbox
                        label="Соглашаюсь с политикой обработки персональных данных"
                        checked={isPolicyAccepted}
                        onChange={(event) => setIsPolicyAccepted(event.target.checked)}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            variant="filled"
                            fullWidth
                            disabled={!name.trim() || !email.trim() || !isPolicyAccepted || isSending}
                        >
                            {isSending ? 'Отправляю...' : 'Отправить'}
                        </Button>
                    </div>
                </form>
            )}
        </Popup>
    );
}
