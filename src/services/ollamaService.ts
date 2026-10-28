import { supabase } from './authService';

export type OllamaModels = { models: string[]; defaultModel: string | null };

/** Lists models installed on the workspace's Ollama server. Nothing is generated or billed. */
export async function listOllamaModels(signal?: AbortSignal, provider: 'ollama' | 'openaicompat' = 'ollama'): Promise<OllamaModels> {
  const { data } = await supabase.auth.getSession();
  const response = await fetch(`/api/ollama-text-generate?provider=${provider}`, { cache: 'no-store',
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
    headers: { Authorization: `Bearer ${data.session?.access_token || ''}` } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || 'Ollama models could not be listed.');
  return { models: Array.isArray(body?.models) ? body.models : [], defaultModel: body?.defaultModel ?? null };
}
