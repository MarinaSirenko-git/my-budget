import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ModalWindow from '@/shared/ui/ModalWindow';
import { currencyOptions } from '@/shared/constants/currencies';
import { loadScenarioData, createScenario } from '@/shared/utils/scenarios';
import ScenarioForm from '@/features/scenarios/ScenarioForm';
import { sanitizeName } from '@/shared/utils/sanitize';
import AddButton from '@/shared/ui/atoms/AddButton';
import { supabase } from '@/lib/supabase';

interface ScenarioSwitchProps {
  mobile?: boolean;
  onMenuClose?: () => void;
}

export default function ScenarioSwitch({ mobile = false, onMenuClose }: ScenarioSwitchProps) {
  const { t } = useTranslation('components');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData(['user']) as { id?: string; email?: string } | null;
  const currentScenario = queryClient.getQueryData(['currentScenario']) as { 
    id?: string | null; 
    slug?: string | null; 
    baseCurrency?: string | null;
  } | null;
  const currentScenarioId = currentScenario?.id ?? null;
  
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState('');
  const [currency, setCurrency] = useState(currencyOptions[0].value);

  const loadCurrentScenarioData = useCallback(async () => {
    if (!user?.id) return;
    
    const { data: profileCtx } = await supabase
      .from('profiles')
      .select(`
        id,
        language,
        current_scenario_id,
        current_scenario_slug,
        current_scenario:scenarios!profiles_current_scenario_fkey (
          id,
          slug,
          base_currency
        )
      `)
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileCtx) {
      queryClient.setQueryData(['profile'], profileCtx);
      
      const currentScenarioData = Array.isArray(profileCtx.current_scenario)
        ? profileCtx.current_scenario[0] ?? null
        : profileCtx.current_scenario ?? null;
      
      queryClient.setQueryData(['currentScenario'], {
        id: profileCtx.current_scenario_id ?? null,
        slug: profileCtx.current_scenario_slug ?? null,
        baseCurrency: currentScenarioData?.base_currency ?? null,
      });
    }
  }, [user?.id, queryClient]);
  
  useEffect(() => {
    if (open && currentScenarioId && user?.id) {
      const loadCurrentScenario = async () => {
        const userId = user.id;
        if (!userId) return;
        const data = await loadScenarioData(currentScenarioId, userId);
        
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
    if (onMenuClose) {
      onMenuClose();
    }
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

    if (!user?.id) {
      setError(t('scenarioForm.errorMessage'));
      setCreating(false);
      return;
    }

    try {
      const scenarioNameToSave = sanitizeName(scenarioName ?? '') || t('scenarioForm.defaultName');
      const result = await createScenario(user.id, scenarioNameToSave, currency, isClone);

      if (!result) {
        throw new Error('Failed to create scenario');
      }

      queryClient.setQueryData(['currentScenario'], {
        id: result.scenarioId,
        slug: result.slug,
        baseCurrency: currency,
      });
      
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
      {mobile ? (
        <AddButton
          onClick={handleAddScenario}
          aria-label={t('header.createAlternativeScenario')}
          className="lg:hidden w-full !bg-black dark:!bg-white !text-white dark:!text-black hover:!bg-white hover:!text-black dark:hover:!bg-black dark:hover:!text-white border border-black dark:border-white"
          inverted={true}
        >
          {t('header.createAlternativeScenario')}
        </AddButton>
      ) : (
        <AddButton
          onClick={handleAddScenario}
          aria-label={t('header.createAlternativeScenario')}
          className="hidden lg:flex !bg-black dark:!bg-white !text-white dark:!text-black hover:!bg-white hover:!text-black dark:hover:!bg-black dark:hover:!text-white border border-black dark:border-white"
          inverted={true}
        >
          {t('header.createAlternativeScenario')}
        </AddButton>
      )}

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

