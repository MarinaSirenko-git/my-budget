import EmptyState from '@/shared/ui/atoms/EmptyState';
import { SparklesIcon } from '@heroicons/react/24/outline';
import TextButton from '@/shared/ui/atoms/TextButton';
import GoalCard from '@/shared/ui/molecules/GoalCard';
import { mockGoals } from '@/mocks/pages/goals.mock';
import { useState } from 'react';
import ModalWindow from '@/shared/ui/ModalWindow';
import Form from '@/shared/ui/form/Form';
import TextInput from '@/shared/ui/form/TextInput';
import MoneyInput from '@/shared/ui/form/MoneyInput';
import SelectInput from '@/shared/ui/form/SelectInput';
import DateInput from '@/shared/ui/form/DateInput';

const currencyOptions = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'RUB', value: 'RUB' },
];

export default function GoalsPage() {
  // State to control modal open/close and editing target
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);

  function handleCreateGoal() {
    setEditingGoal(null);
    setOpen(true);
  }

  function handleEditGoal(goal: any) {
    setEditingGoal(goal);
    setOpen(true);
  }

  function handleModalClose() {
    setOpen(false);
    setEditingGoal(null);
  }

  // Example of prefilled values
  const formInitial = editingGoal
    ? {
        title: editingGoal.name,
        amount: editingGoal.amount,
        currency: editingGoal.currency,
        date: editingGoal.targetDate,
      }
    : { title: '', amount: '', currency: currencyOptions[0].value, date: '' };

  // Form state will be handled/enhanced in next steps; use initial values for now

  if (!mockGoals || mockGoals.length === 0) {
    return (
      <div className="flex flex-1 h-full items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6">
          <EmptyState icon={<SparklesIcon className="w-16 h-16" />}>
            У вас еще нет целей. Добавьте свою первую финансовую цель.
          </EmptyState>
          <TextButton 
            onClick={handleCreateGoal} 
            aria-label="Создать цель" 
            variant="primary"
            className="mt-2"
          >
            Создать цель
          </TextButton>
          <ModalWindow open={open} onClose={handleModalClose} title={editingGoal ? "Редактировать цель" : "Создать цель"}>
            <Form>
              <TextInput defaultValue={formInitial.title} placeholder="Название цели" />
              <MoneyInput defaultValue={formInitial.amount} placeholder="Целевая сумма" />
              <SelectInput value={formInitial.currency} options={currencyOptions} onChange={()=>{}} label="Валюта" />
              <DateInput value={formInitial.date} placeholder="Дата достижения" />
              <TextButton variant="primary" className="mt-4" disabled>{editingGoal ? "Сохранить" : "Создать"}</TextButton>
            </Form>
          </ModalWindow>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-100px)]">
      <ModalWindow open={open} onClose={handleModalClose} title={editingGoal ? "Редактировать цель" : "Создать цель"}>
        <Form>
          <TextInput defaultValue={formInitial.title} placeholder="Название цели" />
          <MoneyInput defaultValue={formInitial.amount} placeholder="Целевая сумма" />
          <SelectInput value={formInitial.currency} options={currencyOptions} onChange={()=>{}} label="Валюта" />
          <DateInput value={formInitial.date} placeholder="Дата достижения" />
          <TextButton variant="primary" className="mt-4" disabled>{editingGoal ? "Сохранить" : "Создать"}</TextButton>
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
        {mockGoals.map((goal) => (
          <GoalCard
            key={goal.name}
            title={goal.name}
            saved={Math.floor(goal.amount * 0.3 + Math.random() * goal.amount * 0.3)}
            target={goal.amount}
            currency={goal.currency}
            monthsLeft={Math.floor(Math.random() * 12 + 1)}
            onEdit={() => handleEditGoal(goal)}
          />
        ))}
      </div>
    </div>
  );
}

