import Form from "@/shared/ui/form/Form";
import TextInput from "@/shared/ui/form/TextInput";
import SelectInput from "@/shared/ui/form/SelectInput";
import MoneyInput from "@/shared/ui/form/MoneyInput";
import TextButton from "@/shared/ui/atoms/TextButton";
import { currencyOptions } from "@/shared/constants/currencies";
import type { CurrencyCode } from "@/shared/constants/currencies";
import type { Expense } from "@/mocks/pages/expenses.mock";

interface FrequencyOption {
  label: string;
  value: Expense['frequency'];
}

interface AddExpenseFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  handleCurrencyChange: (value: string) => void;
  isFormValid: boolean;
  hasChanges: boolean;
  formError: string | null;
  categoryId: string;
  isTagSelected: boolean;
  customCategoryText: string;
  setCustomCategoryText: (value: string) => void;
  expenseCategoryOptions: { label: string; value: string }[];
  handleCategoryChange: (value: string) => void;
  amount: string | undefined;
  setAmount: (value: string | undefined) => void;
  currency: CurrencyCode;
  frequency: Expense['frequency'];
  setFrequency: (value: Expense['frequency']) => void;
  frequencyOptions: FrequencyOption[];
  submitting: boolean;
  editingId: string | null;
  t: (key: string) => string;
}

export default function AddExpenseForm({
  handleSubmit,
  handleCurrencyChange,
  isFormValid,
  hasChanges,
  formError,
  categoryId,
  isTagSelected,
  customCategoryText,
  setCustomCategoryText,
  expenseCategoryOptions,
  handleCategoryChange,
  amount,
  setAmount,
  currency,
  frequency,
  setFrequency,
  frequencyOptions,
  submitting,
  editingId,
  t
}: AddExpenseFormProps) {

  return (
    <Form onSubmit={handleSubmit}>
      {formError && (
        <div className="text-accentRed dark:text-accentRed text-sm">
          {formError}
        </div>
      )}
      {categoryId === 'custom' || isTagSelected ? (
        <TextInput
          value={customCategoryText}
          onChange={(e) => setCustomCategoryText(e.target.value)}
          label={t('expensesForm.categoryLabel')}
          placeholder={t('expensesForm.titlePlaceholder')}
        />
      ) : (
        <SelectInput 
          value={categoryId} 
          options={expenseCategoryOptions} 
          onChange={handleCategoryChange} 
          label={t('expensesForm.categoryLabel')} 
        />
      )}
      <MoneyInput 
        value={amount}
        onValueChange={setAmount}
        placeholder="1,000" 
        label={t('expensesForm.amountLabelFull')}
      />
      <SelectInput 
        value={currency} 
        options={currencyOptions} 
        onChange={handleCurrencyChange} 
        label={t('expensesForm.currencyLabel')} 
      />
      <SelectInput 
        value={frequency} 
        options={frequencyOptions} 
        onChange={(value) => setFrequency(value as Expense['frequency'])} 
        label={t('expensesForm.frequencyLabel')} 
      />
      <TextButton 
        type="submit"
        disabled={!isFormValid || submitting || (editingId !== null && !hasChanges)}
        aria-label={editingId ? t('expensesForm.saveAriaLabel') : t('expensesForm.submitAriaLabel')}
        variant="primary"
        className="mt-4"
      >
        {submitting 
          ? (editingId ? t('expensesForm.savingButton') : t('expensesForm.submittingButton'))
          : (editingId ? t('expensesForm.saveButton') : t('expensesForm.submitButton'))
        }
      </TextButton>
    </Form>
  );
}






