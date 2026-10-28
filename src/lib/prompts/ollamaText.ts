// Server-safe definitions for local text models served by Ollama.
// https://docs.ollama.com/api/chat
export const OLLAMA_TEXT_MODEL = 'ollama/local' as const;
export const OLLAMA_DEFAULT_URL = 'http://127.0.0.1:11434';
export const OLLAMA_DEFAULT_CONTEXT = 16384;
/** The installed model is a device choice: Ollama runs next to the workspace, not in the account. */
export const OLLAMA_MODEL_STORAGE_KEY = 'banana-ollama-model';

export const isOllamaModelName = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(value);

/** Desktop defaults to the local daemon; hosted installs opt in with OLLAMA_BASE_URL. */
export const ollamaBaseUrl = (env: Record<string, string | undefined>): string | null => {
  if (env.OLLAMA_ENABLED === 'false') return null;
  const value = env.OLLAMA_BASE_URL?.trim() || (env.BANANA_RUNTIME === 'local' ? OLLAMA_DEFAULT_URL : '');
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch { return null; }
};

export const ollamaContextSize = (value: unknown): number => {
  const size = Number(value);
  return Number.isSafeInteger(size) && size >= 2048 && size <= 262144 ? size : OLLAMA_DEFAULT_CONTEXT;
};

/** Inline local `#/$defs/x` references; small local grammars handle a flat schema more reliably. */
export const inlineSchemaRefs = (schema: any): any => {
  const defs = schema?.$defs || {};
  const walk = (node: any): any => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== 'object') return node;
    const ref = typeof node.$ref === 'string' && node.$ref.match(/^#\/\$defs\/([\w-]+)$/);
    if (ref && defs[ref[1]]) return walk(defs[ref[1]]);
    return Object.fromEntries(Object.entries(node).filter(([key]) => key !== '$defs').map(([key, value]) => [key, walk(value)]));
  };
  return walk(schema);
};

type ChatPart = { text?: string; inlineData?: { data: string } };
/** Ollama's native chat takes one text body plus base64 images per message. */
export const buildOllamaChat = (input: { model: string; system: string; parts: ChatPart[]; schema?: unknown; numCtx: number }) => {
  const text = input.parts.flatMap(part => typeof part.text === 'string' ? [part.text] : []).join('\n\n');
  const images = input.parts.flatMap(part => typeof part.inlineData?.data === 'string' ? [part.inlineData.data] : []);
  return {
    model: input.model, stream: false,
    messages: [{ role: 'system', content: input.system }, { role: 'user', content: text, ...(images.length ? { images } : {}) }],
    ...(input.schema ? { format: inlineSchemaRefs(input.schema) } : {}),
    options: { num_ctx: input.numCtx },
  };
};

export const ollamaErrorMessage = (status?: number, detail?: string): string => {
  if (status === 404) return 'Ollama modeli bulunamadı. `ollama pull <model>` ile indirip AI settings içinden seç.';
  if (detail && /image|vision|multimodal/i.test(detail)) return 'Seçili yerel model görsel referansları desteklemiyor. Vision destekli bir model seç (ör. gemma3, qwen2.5vl).';
  if (status === 400) return 'Ollama bu isteği kabul etmedi. Modeli ve prompt uzunluğunu kontrol et.';
  return 'Ollama\'ya ulaşılamadı. Ollama\'nın çalıştığını (`ollama serve`) ve adresin doğru olduğunu kontrol et.';
};
