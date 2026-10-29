/** Application routes, verified against the providers' catalogues on 2026-10-20.
 * Auto selects an available route BEFORE submission, never after a paid call. */
export type AIProvider = 'openai' | 'openrouter' | 'gemini' | 'fal' | 'evolink' | 'ollama' | 'openaicompat' | 'sdwebui' | 'comfyui';
/** Self-hosted servers: no key, no credits. Their "key" variable is the server address. */
export const LOCAL_PROVIDERS: readonly AIProvider[] = ['ollama', 'openaicompat', 'sdwebui', 'comfyui'];
export type ProviderChoice = AIProvider | 'auto';
export const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI', openrouter: 'OpenRouter', gemini: 'Google Gemini', fal: 'fal.ai', evolink: 'EvoLink', ollama: 'Ollama (local)',
  openaicompat: 'LM Studio / OpenAI-compatible (local)', sdwebui: 'Stable Diffusion WebUI (local)', comfyui: 'ComfyUI (local)',
};
export const PROVIDER_KEYS: Record<AIProvider, string> = {
  openai: 'OPENAI_API_KEY', openrouter: 'OPENROUTER_API_KEY', gemini: 'GEMINI_API_KEY', fal: 'FAL_KEY', evolink: 'EVOLINK_API_KEY',
  // Not a secret: the local daemon address. Desktop uses the default without setup.
  ollama: 'OLLAMA_BASE_URL', openaicompat: 'LOCAL_OPENAI_BASE_URL', sdwebui: 'SDWEBUI_BASE_URL', comfyui: 'COMFYUI_BASE_URL',
};
export const MODEL_ROUTES: Record<string, readonly AIProvider[]> = {
  'gpt-image-2.5-sunburst': ['openai', 'openrouter', 'fal'],
  'gemini-3-pro-image-preview': ['fal', 'gemini', 'openrouter'],
  'gemini-nano-banana-2.1': ['fal', 'gemini', 'openrouter'],
  // Text models fall back to a local server in Auto when no cloud key is configured.
  'anthropic/claude-opus-5.5': ['openrouter', 'ollama', 'openaicompat'],
  'gpt-6.1-sol': ['openai', 'openrouter', 'ollama', 'openaicompat'],
  'gemini-3.8-flash': ['gemini', 'openrouter', 'ollama', 'openaicompat'],
  'ollama/local': ['ollama', 'openaicompat'],
  'local-image': ['sdwebui', 'comfyui'],
  'local-video': ['comfyui'],
  'seedance-2.0': ['evolink', 'fal', 'openrouter'],
  'seedance-2.5': ['evolink', 'fal', 'openrouter'],
  'minimax-h3': ['fal'],
};
export type ProviderAvailability = Partial<Record<AIProvider, boolean>>;
export function resolveProvider(model: string, choice: unknown, available: ProviderAvailability): AIProvider {
  const routes = MODEL_ROUTES[model];
  if (!Array.isArray(routes)) throw new Error('Unsupported model.');
  if (choice != null && choice !== 'auto') {
    if (!routes.includes(choice as AIProvider)) throw new Error('This provider does not serve the selected model.');
    if (!available[choice as AIProvider]) throw new Error(LOCAL_PROVIDERS.includes(choice as AIProvider)
      ? `${PROVIDER_LABELS[choice as AIProvider]} is not reachable. Start it, check ${PROVIDER_KEYS[choice as AIProvider]} on the server, or choose Auto in AI settings.`
      : `Add your ${PROVIDER_LABELS[choice as AIProvider]} key in Provider keys, or choose Auto in AI settings.`);
    return choice as AIProvider;
  }
  const selected = routes.find(provider => available[provider]);
  if (!selected && routes.every(provider => LOCAL_PROVIDERS.includes(provider))) throw new Error(`This local model needs ${routes.map(provider => PROVIDER_LABELS[provider]).join(' or ')} running. Start one (the desktop app uses the default local address) or set ${routes.map(provider => PROVIDER_KEYS[provider]).join(' or ')} on the server.`);
  if (!selected) throw new Error(`This model needs ${routes.map(provider => PROVIDER_LABELS[provider]).join(' or ')}. Add one key in Provider keys; the other keys are optional.`);
  return selected;
}

export const OPENROUTER_MODELS: Record<string, string> = {
  'gpt-image-2.5-sunburst': 'openai/gpt-image-2.5-sunburst',
  'gemini-3-pro-image-preview': 'google/gemini-3-pro-image',
  'gemini-nano-banana-2.1': 'google/gemini-nano-banana-2.1',
  'gpt-6.1-sol': 'openai/gpt-6.1-sol', 'gemini-3.8-flash': 'google/gemini-3.8-flash',
  'anthropic/claude-opus-5.5': 'anthropic/claude-opus-5.5',
  'seedance-2.0': 'bytedance/seedance-2.0', 'seedance-2.5': 'bytedance/seedance-2.5',
};
