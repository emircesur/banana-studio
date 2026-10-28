import { supabase } from './authService';
import { isLocalWorkspace } from '../lib/config/runtimeConfig';

const KEY = 'banana-daily-budget-usd';
export const BUDGET_EVENT = 'banana-budget-changed';
/** A device-level warning threshold, not a provider spending limit. 0 = off. */
export const getDailyBudget = (): number => {
  try { const value = Number(localStorage.getItem(KEY)); return Number.isFinite(value) && value > 0 ? value : 0; } catch { return 0; }
};
export const setDailyBudget = (value: number): void => {
  try { if (Number.isFinite(value) && value > 0) localStorage.setItem(KEY, String(Math.round(value * 100) / 100)); else localStorage.removeItem(KEY); } catch { /* Best effort. */ }
  window.dispatchEvent(new Event(BUDGET_EVENT));
};

/** Sum of today's recorded estimates for the signed-in user. Unknown costs count as 0. */
export async function getTodaySpend(): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  let total = 0;
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await supabase.from('usage_logs').select('estimated_cost')
      .eq('user_id', session.user.id).gte('created_at', isLocalWorkspace() ? start.getTime() : start.toISOString()).range(from, from + 999);
    if (error) throw new Error('Usage could not be loaded.');
    for (const row of data || []) { const cost = Number(row.estimated_cost); if (Number.isFinite(cost) && cost > 0) total += cost; }
    if (!data || data.length < 1000) break;
  }
  return total;
}
