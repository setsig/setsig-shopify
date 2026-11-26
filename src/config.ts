import type { SetsigClientHeader, ShopifyIntegrationConfig } from './types/index.js';

export const SETSIG_CLIENT_HEADER: SetsigClientHeader = 'shopify/1.0.0';

function readRequiredEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function normalizeBaseUrl(rawUrl: string, key: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL in environment variable ${key}: ${rawUrl}`);
  }
  return parsed.origin + parsed.pathname.replace(/\/+$/, '');
}

function parseCsvList(raw: string | undefined, fallback: readonly string[]): readonly string[] {
  if (!raw || raw.trim().length === 0) {
    return fallback;
  }
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function loadShopifyConfig(env: NodeJS.ProcessEnv = process.env): ShopifyIntegrationConfig {
  const publishableKey = readRequiredEnv(env, 'SETSIG_PUBLISHABLE_KEY');
  if (!publishableKey.startsWith('pk_')) {
    throw new Error('SETSIG_PUBLISHABLE_KEY must be a publishable key with pk_ prefix');
  }

  return {
    setsigApiBaseUrl: normalizeBaseUrl(readRequiredEnv(env, 'SETSIG_API_BASE_URL'), 'SETSIG_API_BASE_URL'),
    setsigMarketingBaseUrl: normalizeBaseUrl(
      readRequiredEnv(env, 'SETSIG_MARKETING_BASE_URL'),
      'SETSIG_MARKETING_BASE_URL',
    ),
    setsigSecretKey: readRequiredEnv(env, 'SETSIG_SECRET_KEY'),
    setsigPublishableKey: publishableKey,
    setsigWebhookSecret: readRequiredEnv(env, 'SETSIG_WEBHOOK_SECRET'),
    checkInTokenSecret: readRequiredEnv(env, 'SETSIG_CHECKIN_TOKEN_SECRET'),
    defaultVenueId: readRequiredEnv(env, 'SETSIG_DEFAULT_VENUE_ID'),
    shopifyClientId: readRequiredEnv(env, 'SHOPIFY_CLIENT_ID'),
    shopifyClientSecret: readRequiredEnv(env, 'SHOPIFY_CLIENT_SECRET'),
    shopifyWebhookSecret: readRequiredEnv(env, 'SHOPIFY_WEBHOOK_SECRET'),
    shopifyAppUrl: normalizeBaseUrl(readRequiredEnv(env, 'SHOPIFY_APP_URL'), 'SHOPIFY_APP_URL'),
    shopifyApiVersion: env.SHOPIFY_API_VERSION?.trim() || '2025-01',
    filter: {
      eligibleTags: parseCsvList(env.SETSIG_ELIGIBLE_TAGS, ['bilet', 'workshop', 'etkinlik']),
      eligibleCollections: parseCsvList(env.SETSIG_ELIGIBLE_COLLECTIONS, ['events', 'workshops', 'tickets']),
    },
    avciCms: {
      baseUrl: normalizeBaseUrl(readRequiredEnv(env, 'AVCI_CMS_BASE_URL'), 'AVCI_CMS_BASE_URL'),
      client: readRequiredEnv(env, 'AVCI_CMS_CLIENT'),
      secret: readRequiredEnv(env, 'AVCI_CMS_SECRET'),
      apiKey: readRequiredEnv(env, 'AVCI_CMS_API_KEY'),
      defaultLanguage: env.AVCI_CMS_DEFAULT_LANGUAGE?.trim() || 'tr',
    },
  };
}

export function buildSetsigRequestHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'X-Setsig-Client': SETSIG_CLIENT_HEADER,
  };
}
