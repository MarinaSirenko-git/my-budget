import SelectInput from '@/shared/ui/form/SelectInput';
import TextButton from '@/shared/ui/atoms/TextButton';
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';

interface FirstScenarioCurrencyFormProps {
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (value: CurrencyCode) => void;
  savingCurrency: boolean;
  onConfirm: () => void;
  t: (key: string) => string;
}

export default function FirstScenarioCurrencyForm({
  selectedCurrency,
  setSelectedCurrency,
  savingCurrency,
  onConfirm,
  t,
}: FirstScenarioCurrencyFormProps) {
  const currencySelectOptions = currencyOptions.map(opt => ({
    label: opt.label,
    value: opt.value,
  }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-textColor dark:text-textColor">
        {t('firstScenarioCurrency.description')}
      </p>
      
      <SelectInput
        value={selectedCurrency}
        options={currencySelectOptions}
        onChange={(value) => setSelectedCurrency(value as CurrencyCode)}
        label={t('firstScenarioCurrency.currencyLabel')}
      />
      
      <div className="flex justify-end gap-2 pt-2">
        <TextButton
          onClick={onConfirm}
          disabled={savingCurrency}
          className="px-4 py-2"
        >
          {savingCurrency 
            ? t('firstScenarioCurrency.confirmingButton')
            : t('firstScenarioCurrency.confirmButton')
          }
        </TextButton>
      </div>
    </div>
  );
}

