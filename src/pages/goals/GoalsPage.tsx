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
    setCurrency(currencyOptions[0].value);
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
    setCurrency(currencyOptions[0].value);
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
          amount: item.target_amount || item.amount,
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
      setFormError(err instanceof Error ? err.message : 'Ошибка сохранения цели');
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
        setError(err instanceof Error ? err.message : 'Ошибка загрузки целей');
      } finally {
        setLoading(false);
      }
    }

    fetchGoals();
  }, [user]);


  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-textColor dark:text-textColor">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-accentRed dark:text-accentRed">Ошибка: {error}</div>
      </div>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center justify-center gap-8 text-mainTextColor dark:text-mainTextColor">
          <EmptyState icon={<img src="/src/assets/goal-page-mouse.webp" alt="Empty State" className="max-h-[200px] max-w-[200px]" />}>
            На что копим и когда? <br /> Добавь свою первую финансовую цель.
          </EmptyState>
          <TextButton 
            onClick={handleCreateGoal} 
            aria-label="Создать цель" 
            variant="primary"
            className="mt-3"
          >
            Создать цель
          </TextButton>
          <ModalWindow open={open} onClose={handleModalClose} title={editingGoal ? "Редактировать цель" : "Создать цель"}>
            <Form onSubmit={handleSubmit}>
              {formError && (
                <div className="text-accentRed dark:text-accentRed text-sm">
                  {formError}
                </div>
              )}
              <TextInput 
                value={name}
                onChange={(e) => setName(e.target.value)}
                label="Название цели"
                placeholder='Покупка машины'
              />
              <MoneyInput 
                value={amount}
                onValueChange={setAmount}
                placeholder="10,000"
                label="Cумма"
              />
              <SelectInput 
                value={currency} 
                options={currencyOptions} 
                onChange={handleCurrencyChange} 
                label="Валюта" 
              />
              <DateInput 
                value={targetDate}
                onChange={setTargetDate}
                label="Когда планируется покупка"
              />
              <TextButton 
                type="submit"
                disabled={!isFormValid || submitting}
                variant="primary" 
                className="mt-4"
                aria-label={editingGoal ? "Сохранить цель" : "Создать цель"}
              >
                {submitting ? (editingGoal ? 'Сохранение...' : 'Создание...') : (editingGoal ? 'Сохранить' : 'Создать')}
              </TextButton>
            </Form>
          </ModalWindow>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 gap-6 min-h-[calc(100vh-100px)]">
      <ModalWindow open={open} onClose={handleModalClose} title={editingGoal ? "Редактировать цель" : "Создать цель"}>
        <Form onSubmit={handleSubmit}>
          {formError && (
            <div className="text-accentRed dark:text-accentRed text-sm">
              {formError}
            </div>
          )}
          <TextInput 
            value={name}
            onChange={(e) => setName(e.target.value)}
            label='Название цели'
          />
          <MoneyInput 
            value={amount}
            onValueChange={setAmount}
            placeholder="10,000" 
            label="Cумма"
          />
          <SelectInput 
            value={currency} 
            options={currencyOptions} 
            onChange={handleCurrencyChange} 
            label="Валюта" 
          />
          <DateInput 
            value={targetDate}
            onChange={setTargetDate}
            placeholder="Дата достижения" 
          />
          <TextButton 
            type="submit"
            disabled={!isFormValid || submitting}
            variant="primary" 
            className="mt-4"
            aria-label={editingGoal ? "Сохранить цель" : "Создать цель"}
          >
            {submitting ? (editingGoal ? 'Сохранение...' : 'Создание...') : (editingGoal ? 'Сохранить' : 'Создать')}
          </TextButton>
        </Form>
      </ModalWindow>
      <div className="flex w-full justify-end">
        <TextButton 
          onClick={handleCreateGoal} 
          aria-label="Добавить новую цель" 
          variant="primary"
        >
          Добавить новую цель
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

