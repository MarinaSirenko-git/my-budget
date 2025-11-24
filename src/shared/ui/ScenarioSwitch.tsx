import { useState, useEffect, useMemo } from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/shared/i18n';
import { useAuth } from '@/shared/store/auth';
import { useNavigate } from 'react-router-dom';
import ModalWindow from '@/shared/ui/ModalWindow';
import TextButton from '@/shared/ui/atoms/TextButton';
import TextInput from '@/shared/ui/form/TextInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import { currencyOptions, type CurrencyCode } from '@/shared/constants/currencies';
import { createSlug } from '@/shared/utils/slug';
import { supabase } from '@/lib/supabase';

const MAX_SCENARIO_NAME_LENGTH = 100;

export default function ScenarioSwitch() {
  const { t } = useTranslation('components');
  const navigate = useNavigate();
  const { user, currentScenarioId, loadCurrentScenarioId, setCurrentScenarioId, loadCurrentScenarioSlug } = useAuth();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState('');
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  
  // Загружаем данные текущего сценария при открытии модального окна для предзаполнения
  useEffect(() => {
    if (open && currentScenarioId && user) {
      const loadCurrentScenario = async () => {
        try {
          const { data, error: fetchError } = await supabase
            .from('scenarios')
            .select('name, base_currency')
            .eq('id', currentScenarioId)
            .eq('user_id', user.id)
            .single();

          if (!fetchError && data) {
            // Предзаполняем поля данными текущего сценария
            setScenarioName(`${data.name} (${t('scenarioForm.copy')})`);
            const validCurrency = currencyOptions.find(opt => opt.value === data.base_currency);
            if (validCurrency) {
              setCurrency(validCurrency.value);
            }
          }
        } catch (err) {
          console.error('Error loading current scenario:', err);
          // При ошибке используем дефолтные значения
          setScenarioName(t('scenarioForm.defaultName'));
          setCurrency(currencyOptions[0].value);
        }
      };

      loadCurrentScenario();
    } else if (open) {
      // Если нет текущего сценария, используем дефолтные значения
      setScenarioName(t('scenarioForm.defaultName'));
      setCurrency(currencyOptions[0].value);
    }
  }, [open, currentScenarioId, user, t]);

  const handleAddScenario = () => {
    if (!user) {
      setError(t('scenarioForm.loginRequired'));
      return;
    }
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setScenarioName('');
    setCurrency(currencyOptions[0].value);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value.length <= MAX_SCENARIO_NAME_LENGTH) {
      setScenarioName(value);
    }
  };

  const isFormValid = useMemo(() => {
    return !!scenarioName.trim();
  }, [scenarioName]);

  const handleCreateScenario = async (isClone: boolean) => {
    if (!user || !isFormValid) return;

    if (isClone && !currentScenarioId) {
      setError(t('scenarioForm.noCurrentScenario'));
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Генерируем slug из имени сценария
      const scenarioNameToSave = scenarioName.trim() || t('scenarioForm.defaultName');
      const scenarioSlug = createSlug(scenarioNameToSave);

      // Вызываем RPC для создания сценария
      const { data: newScenarioId, error: createError } = await supabase.rpc('create_scenario', {
        p_base_currency: currency,
        p_name: scenarioNameToSave,
        p_is_clone: isClone,
      });

      if (createError) throw createError;

      if (!newScenarioId) {
        throw new Error('Failed to create scenario: no ID returned');
      }

      // Обновляем current_scenario_id в profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ current_scenario_id: newScenarioId })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Обновляем store
      setCurrentScenarioId(newScenarioId);
      await loadCurrentScenarioId();
      await loadCurrentScenarioSlug();

      handleClose();
      
      // Редиректим на новый URL с slug
      const currentPath = window.location.pathname;
      const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/goals';
      navigate(`/${scenarioSlug}${pathWithoutSlug}`, { replace: true });
      
      // Отправляем событие для обновления UI
      window.dispatchEvent(new Event('scenarioChanged'));
    } catch (err) {
      console.error(`Error ${isClone ? 'cloning' : 'creating'} scenario:`, err);
      setError(err instanceof Error ? err.message : t('scenarioForm.errorMessage'));
    } finally {
      setCreating(false);
    }
  };


  return (
    <>
      <button
        onClick={handleAddScenario}
        className="text-md text-mainTextColor dark:text-[#F8FAFC] flex items-center gap-1"
      >
        <CurrencyDollarIcon className="w-5 h-5" />
        {t('header.createAlternativeScenario')}
      </button>

      <ModalWindow 
        open={open} 
        onClose={handleClose}
        title={t('scenarioForm.title')}
      >
        <div className="flex flex-col gap-4">
          <TextInput
            type="text"
            value={scenarioName}
            onChange={handleNameChange}
            placeholder={t('scenarioForm.scenarioNamePlaceholder')}
            label={t('scenarioForm.scenarioNameLabel')}
            required
            maxLength={MAX_SCENARIO_NAME_LENGTH}
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
              variant="yellow"
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
      </ModalWindow>
    </>
  );
}

