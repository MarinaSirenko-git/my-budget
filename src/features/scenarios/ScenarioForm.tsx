import TextInput from '@/shared/ui/form/TextInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import TextButton from '@/shared/ui/atoms/TextButton';
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
import { MAX_TEXT_FIELD_LENGTH } from '@/shared/constants/validation';

interface ScenarioFormProps {
  scenarioName: string;
  setScenarioName: (value: string) => void;
  currency: CurrencyCode;
  setCurrency: (value: CurrencyCode) => void;
  error: string | null;
  creating: boolean;
  isFormValid: boolean;
  currentScenarioId: string | null;
  handleCreateScenario: (isClone: boolean) => void;
  t: (key: string) => string;
}

export default function ScenarioForm({
  scenarioName,
  setScenarioName,
  currency,
  setCurrency,
  error,
  creating,
  isFormValid,
  currentScenarioId,
  handleCreateScenario,
  t,
}: ScenarioFormProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[<>]/g, '');
    if (value.length <= MAX_TEXT_FIELD_LENGTH) {
      setScenarioName(value);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        type="text"
        value={scenarioName}
        onChange={handleNameChange}
        placeholder={t('scenarioForm.scenarioNamePlaceholder')}
        label={t('scenarioForm.scenarioNameLabel')}
        required
        maxLength={MAX_TEXT_FIELD_LENGTH}
        disabled={creating}
        id="scenarioName"
      />

      <SelectInput
        value={currency}
        options={currencyOptions}
        onChange={(value) => {
          const validCurrency = currencyOptions.find(opt => opt.value === value);
          if (validCurrency) {
            setCurrency(validCurrency.value as CurrencyCode);
          }
        }}
        label={t('scenarioForm.currencyLabel')}
        disabled={creating}
      />

      {error && (
        <div className="text-sm text-accentRed dark:text-accentRed bg-accentRed/10 dark:bg-accentRed/10 p-3 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-row gap-3 pt-2">
        <TextButton
          onClick={() => handleCreateScenario(false)}
          disabled={!isFormValid || creating}
          variant="default"
          className="flex-1"
          aria-label={t('scenarioForm.createFromScratchAria')}
        >
          {creating ? t('scenarioForm.creating') : t('scenarioForm.createFromScratch')}
        </TextButton>

        {currentScenarioId && (
          <TextButton
            onClick={() => handleCreateScenario(true)}
            disabled={!isFormValid || creating}
            variant="primary"
            className="flex-1"
            aria-label={t('scenarioForm.cloneScenarioAria')}
          >
            {creating ? t('scenarioForm.creating') : t('scenarioForm.cloneScenario')}
          </TextButton>
        )}
      </div>
    </div>
  );
}






