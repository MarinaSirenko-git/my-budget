import { useState } from 'react';
import { useAuth } from '@/shared/store/auth';
import { useScenarioRoute } from '@/shared/router/useScenarioRoute';
import { useTranslation } from '@/shared/i18n';
import { supabase } from '@/lib/supabase';
import { loadExportData, generateCSV, downloadCSV } from '@/shared/utils/csvExport';
import { reportErrorToTelegram } from '@/shared/utils/errorReporting';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function ExportButton() {
  const { t } = useTranslation('components');
  const { t: tPages } = useTranslation('pages');
  const { user } = useAuth();
  const { scenarioId } = useScenarioRoute();
  const [loading, setLoading] = useState(false);

  const handleExport = async (userId: string) => {
    if (!scenarioId) {
      return;
    }

    setLoading(true);

    try {
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('base_currency')
        .eq('id', scenarioId)
        .eq('user_id', userId)
        .single();

      if (scenarioError) throw new Error(t('export.error'));
      const defaultCurrency = scenario?.base_currency;

      const exportData = await loadExportData(userId, scenarioId, defaultCurrency);
      if (!exportData) {
        throw new Error(t('export.error'));
      }
      const csvContent = await generateCSV(exportData, t, tPages);
      const date = new Date().toISOString().split('T')[0];
      const filename = `budget_export_${date}.csv`;

      downloadCSV(csvContent, filename);
    } catch (err) {
      await reportErrorToTelegram({
        action: 'exportData',
        error: err,
        userId: userId,
        context: { scenarioId },
      });
      alert(t('export.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() => {
        if (user?.id) {
          handleExport(user.id);
        }
      }}
      disabled={loading || !user?.id || !scenarioId}
      className="flex items-center font-normal gap-2 py-1 px-2 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ArrowDownTrayIcon className="w-5 h-5" />
      {loading ? t('export.loading') : t('sidebar.exportData')}
    </button>
  );
}

