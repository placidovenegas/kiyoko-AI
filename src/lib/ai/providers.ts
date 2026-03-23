// Thin facade over sdk-router — exposes named factory functions for free providers.
// Premium providers are created on-demand from user keys via createModelWithKey.

export {
  getAllAvailableModels,
  getAllProviderStatuses,
  getModel,
  getModelWithFallback,
  createModelWithKey,
  markProviderFailed,
  logUsage,
  PROVIDER_META,
  TEXT_CHAIN,
  MODELS,
} from './sdk-router';

export type { ProviderId, ResolvedModel, ProviderStatus, ProviderMeta } from './sdk-router';
