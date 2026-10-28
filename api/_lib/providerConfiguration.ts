export const missingProviderMessage = (provider: string, variable: string): string => process.env.BANANA_RUNTIME === 'local'
  ? `Open Provider keys and add your ${provider} API key before using this feature.`
  : `${provider} is not configured. The workspace owner must add ${variable} to the server environment.`;
import { LOCAL_PROVIDERS, PROVIDER_KEYS, resolveProvider, type ProviderAvailability } from '../../src/lib/providers.js';
import { localServerUrl, type LocalServer } from '../../src/lib/localModels.js';

export const providerAvailability = (): ProviderAvailability => ({ ...Object.fromEntries(
  Object.entries(PROVIDER_KEYS).map(([provider, key]) => [provider, Boolean(process.env[key]?.trim()) && process.env[`${provider.toUpperCase()}_ENABLED`] !== 'false']),
), ...Object.fromEntries(LOCAL_PROVIDERS.map(provider => [provider, Boolean(localServerUrl(provider as LocalServer, process.env))])) });
export const chooseProvider = (model: string, preference?: unknown) => resolveProvider(model, preference, providerAvailability());
