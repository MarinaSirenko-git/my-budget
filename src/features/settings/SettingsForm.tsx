import Form from "@/shared/ui/form/Form";
import TextInput from "@/shared/ui/form/TextInput";
import SelectInput from "@/shared/ui/form/SelectInput";
import TextButton from "@/shared/ui/atoms/TextButton";
import type { CurrencyCode } from "@/shared/constants/currencies";

interface LanguageOption {
  label: string;
  value: string;
}

interface SettingsFormProps {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  userEmail?: string;
  placeName: string;
  handlePlaceNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currency: CurrencyCode;
  handleCurrencyChange: (value: string) => void;
  language: string;
  handleLanguageChange: (value: string) => void;
  currencyOptions: Array<{ label: string; value: CurrencyCode }>;
  languageOptions: LanguageOption[];
  isFormValid: boolean;
  hasChanges: boolean;
  saving: boolean;
  message: string | null;
  maxPlaceNameLength: number;
  t: (key: string) => string;
}

export default function SettingsForm({
  handleSubmit,
  userEmail,
  placeName,
  handlePlaceNameChange,
  currency,
  handleCurrencyChange,
  language,
  handleLanguageChange,
  currencyOptions,
  languageOptions,
  isFormValid,
  hasChanges,
  saving,
  message,
  maxPlaceNameLength,
  t,
}: SettingsFormProps) {
  return (
    <Form onSubmit={handleSubmit}>
      <div>
        <label className="block mb-1 text-sm font-medium text-textColor dark:text-textColor">
          {t('settingsForm.googleEmailLabel')}
        </label>
        <TextInput
          type="email"
          value={userEmail || ''}
          readOnly
          className="w-full bg-contentBg dark:bg-cardColor cursor-not-allowed"
        />
      </div>

      <TextInput
        type="text"
        value={placeName}
        onChange={handlePlaceNameChange}
        placeholder={t('settingsForm.scenarioNamePlaceholder')}
        className="w-full"
        disabled={saving}
        required
        maxLength={maxPlaceNameLength}
        label={t('settingsForm.scenarioNameLabel')}
        id="placeName"
      />

      <SelectInput
        value={currency}
        options={currencyOptions}
        onChange={handleCurrencyChange}
        label={t('settingsForm.currencyLabel')}
        disabled={saving}
      />

      <SelectInput
        value={language}
        options={languageOptions}
        onChange={handleLanguageChange}
        label={t('settingsForm.languageLabel')}
        disabled={saving}
      />

      {message && (
        <div 
          className={`text-sm ${message.includes(t('settingsForm.errorMessage')) ? 'text-accentRed dark:text-accentRed' : 'text-success dark:text-success'}`}
          role="alert"
        >
          {message}
        </div>
      )}

      <div className="pt-2">
        <TextButton
          type="submit"
          variant="primary"
          aria-label={t('settingsForm.saveAriaLabel')}
          className="w-full"
          disabled={!isFormValid || !hasChanges || saving}
        >
          {saving ? t('settingsForm.savingButton') : t('settingsForm.saveButton')}
        </TextButton>
      </div>
    </Form>
  );
}

