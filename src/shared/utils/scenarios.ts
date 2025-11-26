import { supabase } from '@/lib/supabase';
import { createSlug, isValidSlug } from './slug';
import { reportErrorToTelegram } from './errorReporting';

export interface Scenario {
  id: string;
  name: string;
}

export interface ScenarioData {
  name: string;
  base_currency: string;
}

/**
 * Ожидает создания сценария триггером с оптимизированной логикой
 * Проверяет обе таблицы (profiles и scenarios) для надежности
 * @param userId ID пользователя
 * @returns ID сценария или null
 */
export async function waitForScenarioCreation(userId: string): Promise<string | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_scenario_id')
    .eq('id', userId)
    .single();

  if (!profileError && profile?.current_scenario_id) {
    return profile.current_scenario_id;
  }

  await new Promise(resolve => setTimeout(resolve, 200));

  const { data: finalProfile, error: finalProfileError } = await supabase
    .from('profiles')
    .select('current_scenario_id')
    .eq('id', userId)
    .single();

  if (!finalProfileError && finalProfile?.current_scenario_id) {
    return finalProfile.current_scenario_id;
  }

  const { data: finalScenarios, error: finalScenariosError } = await supabase
    .from('scenarios')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (!finalScenariosError && finalScenarios && finalScenarios.length > 0) {
    const scenarioId = finalScenarios[0].id;
    await supabase
      .from('profiles')
      .update({ current_scenario_id: scenarioId })
      .eq('id', userId);
    return scenarioId;
  }

  return null;
}

/**
 * Получает slug сценария по его ID
 * @param scenarioId ID сценария
 * @param userId ID пользователя
 * @returns Slug сценария или null
 */
export async function getScenarioSlug(scenarioId: string, userId: string): Promise<string | null> {
  const { data: scenario, error } = await supabase
    .from('scenarios')
    .select('name')
    .eq('id', scenarioId)
    .eq('user_id', userId)
    .single();

  if (error || !scenario?.name) return null;
  return createSlug(scenario.name);
}

/**
 * Валидирует сценарий по slug
 * Проверяет, существует ли сценарий с таким slug для данного пользователя
 * @param scenarioSlug Slug сценария из URL
 * @param userId ID пользователя
 * @returns ID сценария, если валидация успешна, или null
 */
export async function validateScenarioBySlug(
  scenarioSlug: string,
  userId: string
): Promise<string | null> {
  if (!isValidSlug(scenarioSlug)) {
    return null;
  }

  try {
    const { data: scenarios, error: fetchError } = await supabase
      .from('scenarios')
      .select('id, name, user_id')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    const matchingScenario = scenarios?.find(scenario => {
      const scenarioSlugFromName = createSlug(scenario.name);
      return scenarioSlugFromName === scenarioSlug && scenario.user_id === userId;
    });

    return matchingScenario?.id || null;
  } catch (err) {
    await reportErrorToTelegram({
      action: 'validateScenario',
      error: err,
      userId: userId,
      context: { scenarioSlug },
    });
    return null;
  }
}

/**
 * Загружает все сценарии пользователя
 * @param userId ID пользователя
 * @returns Массив сценариев или null в случае ошибки
 */
export async function loadUserScenarios(userId: string): Promise<Scenario[] | null> {
  try {
    const { data: scenarios, error } = await supabase
      .from('scenarios')
      .select('id, name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      await reportErrorToTelegram({
        action: 'loadUserScenarios',
        error: error,
        userId: userId,
        context: { errorCode: error.code },
      });
      return null;
    }

    return scenarios || [];
  } catch (err) {
    await reportErrorToTelegram({
      action: 'loadUserScenarios',
      error: err,
      userId: userId,
    });
    return null;
  }
}

/**
 * Обновляет current_scenario_id в профиле пользователя
 * @param userId ID пользователя
 * @param scenarioId ID сценария
 * @returns true если успешно, false в случае ошибки
 */
export async function updateCurrentScenario(
  userId: string,
  scenarioId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ current_scenario_id: scenarioId })
      .eq('id', userId);

    if (error) {
      await reportErrorToTelegram({
        action: 'updateCurrentScenario',
        error: error,
        userId: userId,
        context: { scenarioId, errorCode: error.code },
      });
      return false;
    }

    return true;
  } catch (err) {
    await reportErrorToTelegram({
      action: 'updateCurrentScenario',
      error: err,
      userId: userId,
      context: { scenarioId },
    });
    return false;
  }
}

export async function loadScenarioData(
  scenarioId: string,
  userId: string
): Promise<ScenarioData | null> {
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('name, base_currency')
      .eq('id', scenarioId)
      .eq('user_id', userId)
      .single();

    if (error) {
      await reportErrorToTelegram({
        action: 'loadScenarioData',
        error: error,
        userId: userId,
        context: { scenarioId, errorCode: error.code },
      });
      return null;
    }

    return data || null;
  } catch (err) {
    await reportErrorToTelegram({
      action: 'loadScenarioData',
      error: err,
      userId: userId,
      context: { scenarioId },
    });
    return null;
  }
}

export interface CreateScenarioResult {
  scenarioId: string;
  slug: string;
}

export async function createScenario(
  userId: string,
  name: string,
  baseCurrency: string,
  isClone: boolean
): Promise<CreateScenarioResult | null> {
  try {
    const { data: newScenarioId, error: createError } = await supabase.rpc('create_scenario', {
      p_base_currency: baseCurrency,
      p_name: name,
      p_is_clone: isClone,
    });

    if (createError) {
      await reportErrorToTelegram({
        action: isClone ? 'cloneScenario' : 'createScenario',
        error: createError,
        userId: userId,
        context: { name, baseCurrency, isClone, errorCode: createError.code },
      });
      throw createError;
    }

    if (!newScenarioId) {
      const error = new Error('Failed to create scenario: no ID returned');
      await reportErrorToTelegram({
        action: isClone ? 'cloneScenario' : 'createScenario',
        error: error,
        userId: userId,
        context: { name, baseCurrency, isClone },
      });
      throw error;
    }

    const success = await updateCurrentScenario(userId, newScenarioId);
    if (!success) {
      const error = new Error('Failed to update current scenario');
      await reportErrorToTelegram({
        action: 'updateCurrentScenarioAfterCreate',
        error: error,
        userId: userId,
        context: { scenarioId: newScenarioId },
      });
      throw error;
    }

    const slug = createSlug(name);
    return { scenarioId: newScenarioId, slug };
  } catch (err) {
    await reportErrorToTelegram({
      action: isClone ? 'cloneScenario' : 'createScenario',
      error: err,
      userId: userId,
      context: { name, baseCurrency, isClone },
    });
    throw err;
  }
}

