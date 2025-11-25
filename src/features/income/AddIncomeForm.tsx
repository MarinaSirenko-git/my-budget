import Form from "@/shared/ui/form/Form";
import TextInput from "@/shared/ui/form/TextInput";
import SelectInput from "@/shared/ui/form/SelectInput";
import MoneyInput from "@/shared/ui/form/MoneyInput";
import TextButton from "@/shared/ui/atoms/TextButton";
import { currencyOptions } from "@/shared/constants/currencies";
import type { CurrencyCode } from "@/shared/constants/currencies";
import type { FrequencyOption } from "@/shared/utils/categories";

interface AddIncomeFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  handleCurrencyChange: (value: string) => void;
  isFormValid: boolean;
  formError: string | null;
  incomeTypeId: string;
  isTagSelected: boolean;
  customCategoryText: string;
  setCustomCategoryText: (value: string) => void;
  incomeTypeOptions: { label: string; value: string }[];
  handleIncomeTypeChange: (value: string) => void;
  amount: string | undefined;
  setAmount: (value: string | undefined) => void;
  currency: CurrencyCode;
  frequency: string;
  setFrequency: (value: string) => void;
  frequencyOptions: FrequencyOption[];
  submitting: boolean;
  editingId: string | null;
  t: (key: string) => string;
}

export default function AddIncomeForm({
  handleSubmit,
  handleCurrencyChange,
  isFormValid,
  formError,
  incomeTypeId,
  isTagSelected,
  customCategoryText,
  setCustomCategoryText,
  incomeTypeOptions,
  handleIncomeTypeChange,
  amount,
  setAmount,
  currency,
  frequency,
  setFrequency,
  frequencyOptions,
  submitting,
  editingId,
  t
}: AddIncomeFormProps) {

  return (
    <Form onSubmit={handleSubmit}>
    {formError && (
      <div className="text-accentRed dark:text-accentRed text-sm">
        {formError}
      </div>
    )}
    {incomeTypeId === 'custom' || isTagSelected ? (
      <TextInput
        value={customCategoryText}
        onChange={(e) => setCustomCategoryText(e.target.value)}
        label={t('incomeForm.categoryLabel')}
        placeholder={t('incomeForm.customCategoryPlaceholder')}
      />
    ) : (
      <SelectInput 
        value={incomeTypeId} 
        options={incomeTypeOptions} 
        onChange={handleIncomeTypeChange} 
        label={t('incomeForm.categoryLabel')}
        creatable={true}
      />
    )}
    <MoneyInput 
      value={amount}
      onValueChange={setAmount}
      placeholder="1,000"
      label={t('incomeForm.amountLabelFull')}
    />
    <SelectInput 
      value={currency} 
      options={currencyOptions} 
      onChange={handleCurrencyChange} 
      label={t('incomeForm.currencyLabel')} 
    />
    <SelectInput 
      value={frequency} 
      options={frequencyOptions} 
      onChange={setFrequency} 
      label={t('incomeForm.frequencyLabel')} 
    />
    <TextButton 
      type="submit"
      disabled={!isFormValid || submitting}
      aria-label={editingId ? t('incomeForm.saveAriaLabel') : t('incomeForm.submitAriaLabel')}
      variant="primary"
      className="mt-4"
    >
      {submitting 
        ? (editingId ? t('incomeForm.savingButton') : t('incomeForm.submittingButton'))
        : (editingId ? t('incomeForm.saveButton') : t('incomeForm.submitButton'))
      }
    </TextButton>
  </Form>
  );
}