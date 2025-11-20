import EmptyState from '@/shared/ui/atoms/EmptyState';
import TextButton from '@/shared/ui/atoms/TextButton';
import GoalCard from '@/shared/ui/molecules/GoalCard';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/shared/store/auth';
import ModalWindow from '@/shared/ui/ModalWindow';
import Form from '@/shared/ui/form/Form';
import TextInput from '@/shared/ui/form/TextInput';
import MoneyInput from '@/shared/ui/form/MoneyInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import DateInput from '@/shared/ui/form/DateInput';
import { currencyOptions } from '@/shared/constants/currencies';
import { useTranslation } from '@/shared/i18n';

interface Goal {
  id: string;
  name: string;
  amount: number;
  currency: string;
  targetDate: string;
  saved?: number;
  monthsLeft?: number;
}

export default function GoalsPage() {
  const { user } = useAuth();
  const { t } = useTranslation('components');
  // State to control modal open/close and editing target
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [currency, setCurrency] = useState(currencyOptions[0].value);
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [settingsCurrency, setSettingsCurrency] = useState<string | null>(null);

  // Load settings currency
  useEffect(() => {
    async function loadSettingsCurrency() {
      if (!user) {
        // Fallback to localStorage
        const savedCurrency = localStorage.getItem('user_currency');
        if (savedCurrency) {
          setSettingsCurrency(savedCurrency);
        }
        return;
      }

      try {
        // Try to load from Supabase profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('default_currency')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // Fallback to localStorage on error
          const savedCurrency = localStorage.getItem('user_currency');
          if (savedCurrency) {
            setSettingsCurrency(savedCurrency);
          }
        } else if (data?.default_currency) {
          setSettingsCurrency(data.default_currency);
        } else {
          // Fallback to localStorage
          const savedCurrency = localStorage.getItem('user_currency');
          if (savedCurrency) {
            setSettingsCurrency(savedCurrency);
          }
        }
      } catch (err) {
        console.error('Error loading settings currency:', err);
        // Fallback to localStorage
        const savedCurrency = localStorage.getItem('user_currency');
        if (savedCurrency) {
          setSettingsCurrency(savedCurrency);
        }
      }
    }

    loadSettingsCurrency();

    // Listen for currency changes in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_currency' && e.newValue) {
        setSettingsCurrency(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-window updates
    const handleCustomStorageChange = () => {
      const savedCurrency = localStorage.getItem('user_currency');
      if (savedCurrency) {
        setSettingsCurrency(savedCurrency);
      }
    };

    window.addEventListener('currencyChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('currencyChanged', handleCustomStorageChange);
    };
  }, [user]);

  // Set default currency from settings when loaded
  useEffect(() => {
    if (settingsCurrency) {
      const validCurrency = currencyOptions.find(opt => opt.value === settingsCurrency);
      if (validCurrency && currency === currencyOptions[0].value) {
        setCurrency(settingsCurrency);
      }
    }
  }, [settingsCurrency]);

  // Wrapper function to handle currency change with validation
  const handleCurrencyChange = (newCurrency: string) => {
    const validCurrency = currencyOptions.find(opt => opt.value === newCurrency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    }
  };

  function handleCreateGoal() {
    setEditingGoal(null);
    setName('');
    setAmount(undefined);
    const defaultCurrency = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setTargetDate(undefined);
    setFormError(null);
    setOpen(true);
  }

  function handleEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setName(goal.name);
    setAmount(goal.amount.toString());
    const validCurrency = currencyOptions.find(opt => opt.value === goal.currency);
    if (validCurrency) {
      setCurrency(validCurrency.value);
    } else {
      setCurrency(currencyOptions[0].value);
    }
    setTargetDate(goal.targetDate);
    setFormError(null);
    setOpen(true);
  }

  function handleModalClose() {
    setOpen(false);
    setEditingGoal(null);
    setName('');
    setAmount(undefined);
    const defaultCurrency = settingsCurrency || currencyOptions[0].value;
    const validCurrency = currencyOptions.find(opt => opt.value === defaultCurrency);
    setCurrency(validCurrency ? validCurrency.value : currencyOptions[0].value);
    setTargetDate(undefined);
    setFormError(null);
  }

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return !!(
      name.trim() &&
      amount &&
      parseFloat(amount) > 0 &&
      currency &&
      targetDate
    );
  }, [name, amount, currency, targetDate]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user || !isFormValid) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      
      const goalData = {
        user_id: user.id,
        name: name.trim(),
        target_amount: parseFloat(amount!),
        current_amount: editingGoal?.saved || 0,
        target_date: targetDate!,
        currency: currency,
      };

      if (editingGoal) {
        // Update existing goal
        const { error: updateError } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', editingGoal.id)
          .eq('user_id', user.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new goal
        const { error: insertError } = await supabase
          .from('goals')
          .insert(goalData);

        if (insertError) {
          throw insertError;
        }
      }

      // Refresh goals list
      const { data, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const mappedGoals: Goal[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          amount: item.target_amount,
          currency: item.currency,
          targetDate: item.target_date || item.targetDate,
          saved: item.current_amount || item.saved || 0,
          monthsLeft: item.months_left || undefined,
        }));
        setGoals(mappedGoals);
      }

      handleModalClose();
    } catch (err) {
      console.error('Error saving goal:', err);
      setFormError(err instanceof Error ? err.message : t('goalsForm.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  }

  // Fetch goals from Supabase
  useEffect(() => {
    async function fetchGoals() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          // Map Supabase data to Goal interface
          const mappedGoals: Goal[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            amount: item.target_amount || item.amount,
            currency: item.currency,
            targetDate: item.target_date || item.targetDate,
            saved: item.current_amount || item.saved || 0,
            monthsLeft: item.months_left || undefined,
          }));
          setGoals(mappedGoals);
        }
      } catch (err) {
        console.error('Error fetching goals:', err);
        setError(err instanceof Error ? err.message : t('goalsForm.loadingError'));
      } finally {
        setLoading(false);
      }
    }

    fetchGoals();
  }, [user]);


  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-textColor dark:text-textColor">{t('goalsForm.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-accentRed dark:text-accentRed">{t('goalsForm.errorPrefix')} {error}</div>
      </div>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-8 text-mainTextColor dark:text-mainTextColor">
          <EmptyState icon={<img src="/src/assets/goal-page-mouse.webp" alt="Empty State" className="max-h-[200px] max-w-[200px]" />}>
            <span dangerouslySetInnerHTML={{ __html: t('goalsForm.emptyStateMessage') }} />
          </EmptyState>
          <TextButton 
            onClick={handleCreateGoal} 
            aria-label={t('goalsForm.createAriaLabel')} 
            variant="primary"
            className="mt-3"
          >
            {t('goalsForm.createButton')}
          </TextButton>
          <ModalWindow open={open} onClose={handleModalClose} title={editingGoal ? t('goalsForm.editTitle') : t('goalsForm.createTitle')}>
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
              />
              <TextButton 
                type="submit"
                disabled={!isFormValid || submitting}
                variant="primary" 
                className="mt-4"
                aria-label={editingGoal ? t('goalsForm.saveAriaLabel') : t('goalsForm.createAriaLabel')}
              >
                {submitting ? (editingGoal ? t('goalsForm.savingButton') : t('goalsForm.creatingButton')) : (editingGoal ? t('goalsForm.saveButton') : t('goalsForm.createButton'))}
              </TextButton>
            </Form>
          </ModalWindow>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 gap-6 min-h-[calc(100vh-100px)]">
      <ModalWindow open={open} onClose={handleModalClose} title={editingGoal ? t('goalsForm.editTitle') : t('goalsForm.createTitle')}>
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
            aria-label={editingGoal ? t('goalsForm.saveAriaLabel') : t('goalsForm.createAriaLabel')}
          >
            {submitting ? (editingGoal ? t('goalsForm.savingButton') : t('goalsForm.creatingButton')) : (editingGoal ? t('goalsForm.saveButton') : t('goalsForm.createButton'))}
          </TextButton>
        </Form>
      </ModalWindow>
      <div className="flex w-full justify-end">
        <TextButton 
          onClick={handleCreateGoal} 
          aria-label={t('goalsForm.addNewAriaLabel')} 
          variant="primary"
        >
          {t('goalsForm.addNewButton')}
        </TextButton>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
        {goals.map((goal) => {
          // Calculate months left if not provided
          const monthsLeft = goal.monthsLeft || (() => {
            const targetDate = new Date(goal.targetDate);
            const today = new Date();
            const diffTime = targetDate.getTime() - today.getTime();
            const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
            return Math.max(0, diffMonths);
          })();
          
          // Use saved amount from DB or calculate a default
          const saved = goal.saved ?? Math.floor(goal.amount * 0.3);
          
          return (
            <GoalCard
              key={goal.id}
              title={goal.name}
              saved={saved}
              target={goal.amount}
              currency={goal.currency}
              monthsLeft={monthsLeft}
              onEdit={() => handleEditGoal(goal)}
            />
          );
        })}
      </div>
    </div>
  );
}

