import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ModalWindow from '@/shared/ui/ModalWindow';
import Form from '@/shared/ui/form/Form';
import TextareaInput from '@/shared/ui/form/TextareaInput';
import TextButton from '@/shared/ui/atoms/TextButton';
import { useTranslation } from '@/shared/i18n';

interface FeedbackProps {
  /** Additional className for the button */
  className?: string;
}

export default function Feedback({ 
  className = '' 
}: FeedbackProps) {
  const { user } = useAuth();
  const { t } = useTranslation('components');
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
      setMessage(t('feedbackForm.validationError'));
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const userEmail = user?.email || t('feedbackForm.emailNotSpecified');
      const feedbackMessage = `${t('feedbackForm.telegramMessagePrefix')} ${userEmail}:\n\n${feedback.trim()}`;
      
      const { error } = await supabase.functions.invoke('send-to-telegram', {
        body: { message: feedbackMessage }
      });

      if (error) {
        throw error;
      }

      setMessage(t('feedbackForm.successMessage'));
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error sending feedback:', err);
      setMessage(t('feedbackForm.errorMessage'));
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
          aria-label={t('feedbackForm.buttonAriaLabel')}
          title={t('feedbackForm.buttonTitle')}
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
            label={t('feedbackForm.label')}
            required
            disabled={submitting}
            className="w-full"
            description={t('feedbackForm.description')}
          />

          {message && (
            <div className={`text-sm ${message.includes(t('feedbackForm.errorMessage')) ? 'text-accentRed dark:text-accentRed' : 'text-success dark:text-success'}`}>
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
              {t('feedbackForm.cancelButton')}
            </TextButton>
            <TextButton
              type="submit"
              variant="primary"
              disabled={!feedback.trim() || submitting}
              aria-label={t('feedbackForm.submitAriaLabel')}
            >
              {submitting ? t('feedbackForm.submittingButton') : t('feedbackForm.submitButton')}
            </TextButton>
          </div>
        </Form>
      </ModalWindow>
    </>
  );
}

