import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import ModalWindow from '@/shared/ui/ModalWindow';
import FeedbackForm from '@/features/feedback/FeedbackForm';
import { useTranslation } from '@/shared/i18n';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';

interface FeedbackProps {
  className?: string;
}

export default function Feedback({ 
  className = '' 
}: FeedbackProps) {
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData(['user']) as { id?: string; email?: string } | null;
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
    if (submitting) {
      console.warn('Submit already in progress, ignoring duplicate request');
      return;
    }

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
      await reportErrorToTelegram({
        action: 'sendFeedback',
        error: err,
        userId: user?.id,
        context: { feedbackLength: feedback.trim().length },
      });
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
            text-white
            shadow-md
            transition-all
            bg-white
            flex items-center justify-center
            focus-visible:ring-2 focus-visible:ring-offset-2
            focus:outline-none
          "
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-black" />
        </button>
      </div>

      <ModalWindow open={open} onClose={handleClose}>
        <FeedbackForm
          feedback={feedback}
          setFeedback={setFeedback}
          submitting={submitting}
          message={message}
          handleSubmit={handleSubmit}
          handleClose={handleClose}
          t={t}
        />
      </ModalWindow>
    </>
  );
}

