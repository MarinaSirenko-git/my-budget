import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ModalWindow from '@/shared/ui/ModalWindow';
import Form from '@/shared/ui/form/Form';
import TextareaInput from '@/shared/ui/form/TextareaInput';
import TextButton from '@/shared/ui/atoms/TextButton';

interface FeedbackProps {
  /** Additional className for the button */
  className?: string;
}

export default function Feedback({ 
  className = '' 
}: FeedbackProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleOpen = () => {
    setOpen(true);
    setFeedback('');
    setMessage(null);
  };

  const handleClose = () => {
    setOpen(false);
    setFeedback('');
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!feedback.trim()) {
      setMessage('Пожалуйста, введите ваш отзыв');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const userEmail = user?.email || 'Не указан';
      const feedbackMessage = `Новый фидбек от ${userEmail}:\n\n${feedback.trim()}`;
      
      const { error } = await supabase.functions.invoke('send-to-telegram', {
        body: { message: feedbackMessage }
      });

      if (error) {
        throw error;
      }

      setMessage('Спасибо за ваш отзыв!');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error sending feedback:', err);
      setMessage('Ошибка отправки отзыва. Попробуйте позже.');
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <button
          onClick={handleOpen}
          aria-label="Оставить отзыв"
          title="Оставить отзыв"
          className="
            w-14 h-14
            rounded-full
            bg-accentRed dark:bg-accentRed
            text-white
            shadow-lg
            hover:bg-accentRed/90 dark:hover:bg-accentRed/90
            active:bg-accentRed/80 dark:active:bg-accentRed/80
            transition-all
            flex items-center justify-center
            focus-visible:ring-2 focus-visible:ring-accentRed focus-visible:ring-offset-2
            focus:outline-none
          "
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        </button>
      </div>

      <ModalWindow open={open} onClose={handleClose}>
        <Form onSubmit={handleSubmit}>
          <TextareaInput
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            label="Есть вопросы или предложения?"
            required
            disabled={submitting}
            className="w-full"
            description="Я получу твое сообщение в Telegram и отвечу тебе как можно скорее на почту которая была указана при регистрации"
          />

          {message && (
            <div className={`text-sm ${message.includes('Ошибка') ? 'text-accentRed dark:text-accentRed' : 'text-success dark:text-success'}`}>
              {message}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <TextButton
              type="button"
              onClick={handleClose}
              variant="default"
              disabled={submitting}
            >
              Отмена
            </TextButton>
            <TextButton
              type="submit"
              variant="primary"
              disabled={!feedback.trim() || submitting}
              aria-label="Отправить отзыв"
            >
              {submitting ? 'Отправка...' : 'Отправить'}
            </TextButton>
          </div>
        </Form>
      </ModalWindow>
    </>
  );
}

