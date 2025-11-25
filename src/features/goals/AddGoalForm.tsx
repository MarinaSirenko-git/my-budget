import Form from "@/shared/ui/form/Form";
import TextInput from "@/shared/ui/form/TextInput";
import SelectInput from "@/shared/ui/form/SelectInput";
import MoneyInput from "@/shared/ui/form/MoneyInput";
import DateInput from "@/shared/ui/form/DateInput";
import TextButton from "@/shared/ui/atoms/TextButton";
import { currencyOptions } from "@/shared/constants/currencies";
import type { CurrencyCode } from "@/shared/constants/currencies";

interface AddGoalFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  handleCurrencyChange: (value: string) => void;
  isFormValid: boolean;
  formError: string | null;
  name: string;
  setName: (value: string) => void;
  amount: string | undefined;
  setAmount: (value: string | undefined) => void;
  currency: CurrencyCode;
  targetDate: string | undefined;
  setTargetDate: (value: string | undefined) => void;
  submitting: boolean;
  editingId: string | null;
  t: (key: string) => string;
}

export default function AddGoalForm({
  handleSubmit,
  handleCurrencyChange,
  isFormValid,
  formError,
  name,
  setName,
  amount,
  setAmount,
  currency,
  targetDate,
  setTargetDate,
  submitting,
  editingId,
  t
}: AddGoalFormProps) {

  return (
    <Form onSubmit={handleSubmit}>
      {formError && (
        <div className="text-accentRed dark:text-accentRed text-sm">
          {formError}
        </div>
      )}
      <TextInput 
        value={name}
        onChange={(e) => setName(e.target.value)}
        label={t('goalsForm.nameLabel')}
        placeholder={t('goalsForm.namePlaceholder')}
      />
      <MoneyInput 
        value={amount}
        onValueChange={setAmount}
        placeholder="10,000"
        label={t('goalsForm.amountLabel')}
      />
      <SelectInput 
        value={currency} 
        options={currencyOptions} 
        onChange={handleCurrencyChange} 
        label={t('goalsForm.currencyLabel')} 
      />
      <DateInput 
        value={targetDate}
        onChange={setTargetDate}
        label={t('goalsForm.targetDateLabel')}
        placeholder={t('goalsForm.targetDatePlaceholder')} 
      />
      <TextButton 
        type="submit"
        disabled={!isFormValid || submitting}
        variant="primary" 
        className="mt-4"
        aria-label={editingId ? t('goalsForm.saveAriaLabel') : t('goalsForm.createAriaLabel')}
      >
        {submitting 
          ? (editingId ? t('goalsForm.savingButton') : t('goalsForm.creatingButton'))
          : (editingId ? t('goalsForm.saveButton') : t('goalsForm.createButton'))
        }
      </TextButton>
    </Form>
  );
}

