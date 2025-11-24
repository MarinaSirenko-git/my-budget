import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/shared/store/auth';
import { useScenarioRoute } from '@/shared/router/useScenarioRoute';
import { useTranslation } from '@/shared/i18n';
import { supabase } from '@/lib/supabase';
import { loadExportData, generateCSV, downloadCSV } from '@/shared/utils/csvExport';

export default function ExportButton() {
  const { user } = useAuth();
  const { scenarioId } = useScenarioRoute();
  const { t } = useTranslation('components');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      if (!scenarioId) {
        throw new Error(t('export.error'));
      }

      // Получаем валюту из текущего сценария
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('base_currency')
        .eq('id', scenarioId)
        .eq('user_id', user.id)
        .single();

      if (scenarioError) {
        throw new Error(t('export.error'));
      }

      const defaultCurrency = scenario?.base_currency || 'USD';

      // Загружаем данные
      const exportData = await loadExportData(user.id, scenarioId, defaultCurrency);

      if (!exportData) {
        throw new Error(t('export.error'));
      }

      // Генерируем CSV
      const csvContent = await generateCSV(exportData, t);

      // Формируем имя файла
      const date = new Date().toISOString().split('T')[0];
      const filename = `budget_export_${date}.csv`;

      // Скачиваем файл
      downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert(t('export.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center font-normal gap-2 py-1 px-2 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ArrowDownTrayIcon className="w-5 h-5" />
      {loading ? t('export.loading') : t('sidebar.exportData')}
    </button>
  );
}

