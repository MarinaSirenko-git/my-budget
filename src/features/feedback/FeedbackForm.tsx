import Form from '@/shared/ui/form/Form';
import TextareaInput from '@/shared/ui/form/TextareaInput';
import TextButton from '@/shared/ui/atoms/TextButton';

interface FeedbackFormProps {
  feedback: string;
  setFeedback: (value: string) => void;
  submitting: boolean;
  message: string | null;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleClose: () => void;
  t: (key: string) => string;
}

export default function FeedbackForm({
  feedback,
  setFeedback,
  submitting,
  message,
  handleSubmit,
  handleClose,
  t,
}: FeedbackFormProps) {
  return (
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
  );
}







