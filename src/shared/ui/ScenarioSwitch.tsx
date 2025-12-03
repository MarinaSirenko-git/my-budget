import { useState, useEffect, useMemo } from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/shared/i18n';
import { useAuth } from '@/shared/store/auth';
import { useNavigate } from 'react-router-dom';
import ModalWindow from '@/shared/ui/ModalWindow';
import { currencyOptions } from '@/shared/constants/currencies';
import { loadScenarioData, createScenario } from '@/shared/utils/scenarios';
import ScenarioForm from '@/features/scenarios/ScenarioForm';
import { sanitizeName } from '@/shared/utils/sanitize';

export default function ScenarioSwitch() {
  const { t } = useTranslation('components');
  const navigate = useNavigate();
  const { user, currentScenarioId, loadCurrentScenarioData, setCurrentScenarioId } = useAuth();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState('');
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  
  useEffect(() => {
    if (open && currentScenarioId) {
      const loadCurrentScenario = async () => {
        const data = await loadScenarioData(currentScenarioId, user!.id);
        
        if (data) {
          setScenarioName(`${data.name} (${t('scenarioForm.copy')})`);
          const validCurrency = currencyOptions.find(opt => opt.value === data.base_currency);
          if (validCurrency) {
            setCurrency(validCurrency.value);
          }
        } else {
          setScenarioName(t('scenarioForm.defaultName'));
          setCurrency(currencyOptions[0].value);
        }
      };

      loadCurrentScenario();
    } else if (open) {
      setScenarioName(t('scenarioForm.defaultName'));
      setCurrency(currencyOptions[0].value);
    }
  }, [open, currentScenarioId, user, t]);

  const handleAddScenario = () => {
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setScenarioName('');
    setCurrency(currencyOptions[0].value);
  };

  const isFormValid = useMemo(() => {
    return !!scenarioName.trim();
  }, [scenarioName]);

  const handleCreateScenario = async (isClone: boolean) => {
    if (creating) {
      console.warn('Create scenario already in progress, ignoring duplicate request');
      return;
    }
    if (!isFormValid) return;

    if (isClone && !currentScenarioId) {
      setError(t('scenarioForm.noCurrentScenario'));
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const scenarioNameToSave = sanitizeName(scenarioName ?? '') || t('scenarioForm.defaultName');
      const result = await createScenario(user!.id, scenarioNameToSave, currency, isClone);

      if (!result) {
        throw new Error('Failed to create scenario');
      }

      setCurrentScenarioId(result.scenarioId);
      await loadCurrentScenarioData();

      handleClose();
      
      const currentPath = window.location.pathname;
      const pathWithoutSlug = currentPath.replace(/^\/[^/]+/, '') || '/goals';
      navigate(`/${result.slug}${pathWithoutSlug}`, { replace: true });
      
      window.dispatchEvent(new Event('scenarioChanged'));
    } catch (err) {
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
        <ScenarioForm
          scenarioName={scenarioName}
          setScenarioName={setScenarioName}
          currency={currency}
          setCurrency={setCurrency}
          error={error}
          creating={creating}
          isFormValid={isFormValid}
          currentScenarioId={currentScenarioId}
          handleCreateScenario={handleCreateScenario}
          t={t}
        />
      </ModalWindow>
    </>
  );
}

