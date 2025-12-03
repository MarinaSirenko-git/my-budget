import Form from "@/shared/ui/form/Form";
import TextInput from "@/shared/ui/form/TextInput";
import SelectInput from "@/shared/ui/form/SelectInput";
import MoneyInput from "@/shared/ui/form/MoneyInput";
import TextButton from "@/shared/ui/atoms/TextButton";
import { currencyOptions } from "@/shared/constants/currencies";
import type { CurrencyCode } from "@/shared/constants/currencies";

interface AddSavingFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  handleCurrencyChange: (value: string) => void;
  isFormValid: boolean;
  hasChanges: boolean;
  formError: string | null;
  comment: string;
  setComment: (value: string) => void;
  amount: string | undefined;
  setAmount: (value: string | undefined) => void;
  currency: CurrencyCode;
  submitting: boolean;
  editingId: string | null;
  t: (key: string) => string;
}

export default function AddSavingForm({
  handleSubmit,
  handleCurrencyChange,
  isFormValid,
  hasChanges,
  formError,
  comment,
  setComment,
  amount,
  setAmount,
  currency,
  submitting,
  editingId,
  t
}: AddSavingFormProps) {

  return (
    <Form onSubmit={handleSubmit}>
      {formError && (
        <div className="text-accentRed dark:text-accentRed text-sm">
          {formError}
        </div>
      )}
      <TextInput 
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        label={t('savingsForm.nameLabel')}
        placeholder={t('savingsForm.namePlaceholder')}
      />
      <MoneyInput 
        value={amount}
        onValueChange={setAmount}
        placeholder="10,000"
        label={t('savingsForm.amountLabel')}
      />
      <SelectInput 
        value={currency} 
        options={currencyOptions} 
        onChange={handleCurrencyChange} 
        label={t('savingsForm.currencyLabel')} 
      />
      <TextButton 
        type="submit"
        disabled={!isFormValid || submitting || (editingId !== null && !hasChanges)}
        variant="primary" 
        className="mt-4"
        aria-label={editingId ? t('savingsForm.saveAriaLabel') : t('savingsForm.createAriaLabel')}
      >
        {submitting 
          ? (editingId ? t('savingsForm.savingButton') : t('savingsForm.creatingButton'))
          : (editingId ? t('savingsForm.saveButton') : t('savingsForm.createButton'))
        }
      </TextButton>
    </Form>
  );
}

