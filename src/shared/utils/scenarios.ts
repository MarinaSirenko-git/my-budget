import { supabase } from '@/lib/supabase';
import { reportErrorToTelegram } from './errorReporting';

export interface Scenario {
  id: string;
  name: string;
  slug: string;
}

export interface CurrentScenario {
  id: string | null;
  slug: string | null;
  baseCurrency: string | null;
}

export interface ScenarioData {
  name: string;
  base_currency: string;
}

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

export async function validateScenarioBySlug(
  scenarioSlug: string,
  userId: string
): Promise<string | null> {

  try {
    const { data: scenarios, error: fetchError } = await supabase
      .from('scenarios')
      .select('id, name, slug, user_id')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    const matchingScenario = scenarios?.find(scenario => {
      return scenario.slug === scenarioSlug && scenario.user_id === userId;
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

export async function loadUserScenarios(userId: string): Promise<Scenario[] | null> {
  try {
    const { data: scenarios, error } = await supabase
      .from('scenarios')
      .select('id, name, slug')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to load user scenarios');
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

export async function updateCurrentScenario(
  userId: string,
  scenarioId: string,
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
      .select('name, base_currency, slug')
      .eq('id', scenarioId)
      .eq('user_id', userId)
      .single();

    if (error) {
     throw new Error('Failed to load scenario data');
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
    const { data, error: createError } = await supabase.rpc('create_scenario', {
      p_base_currency: baseCurrency,
      p_name: name,
      p_is_clone: isClone,
    });

    if (createError) throw new Error('Failed to create scenario');

    const success = await updateCurrentScenario(userId, data.newScenarioId);
    if (!success) throw new Error('Failed to update current scenario');

    return { scenarioId: data.id, slug: data.slug };
  } catch (err) {
    await reportErrorToTelegram({
      action: isClone ? 'cloneScenario' : 'createScenario',
      error: err,
      userId: userId,
      context: { name, baseCurrency, isClone },
    });
    return null;
  }
}

