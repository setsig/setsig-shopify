import type {
  GdprHandlerResult,
  GdprStoreAdapter,
  GdprTopic,
  ShopifyGdprCustomerDataRequest,
  ShopifyGdprCustomerRedact,
  ShopifyGdprShopRedact,
} from './types/index.js';
import { verifyShopifyWebhookHmac } from './hmac.js';

export async function handleCustomersDataRequest(
  payload: ShopifyGdprCustomerDataRequest,
  store?: GdprStoreAdapter,
): Promise<GdprHandlerResult> {
  if (store) {
    await store.exportCustomerRecords(
      payload.shop_domain,
      payload.customer.id,
      payload.orders_requested,
    );
  }

  return {
    topic: 'customers/data_request',
    shopDomain: payload.shop_domain,
    acknowledged: true,
    processedAt: new Date().toISOString(),
    auditNote: `Export queued for request #${payload.data_request.id} (${payload.orders_requested.length} orders)`,
  };
}

export async function handleCustomersRedact(
  payload: ShopifyGdprCustomerRedact,
  store?: GdprStoreAdapter,
): Promise<GdprHandlerResult> {
  if (store) {
    await store.eraseCustomerRecords(
      payload.shop_domain,
      payload.customer.id,
      payload.orders_to_redact,
    );
  }

  return {
    topic: 'customers/redact',
    shopDomain: payload.shop_domain,
    acknowledged: true,
    processedAt: new Date().toISOString(),
    auditNote: `Redacted customer #${payload.customer.id} across ${payload.orders_to_redact.length} orders`,
  };
}

export async function handleShopRedact(
  payload: ShopifyGdprShopRedact,
  store?: GdprStoreAdapter,
): Promise<GdprHandlerResult> {
  if (store) {
    await store.eraseShopRecords(payload.shop_domain);
  }

  return {
    topic: 'shop/redact',
    shopDomain: payload.shop_domain,
    acknowledged: true,
    processedAt: new Date().toISOString(),
    auditNote: `Redacted all shop integration records for ${payload.shop_domain} (#${payload.shop_id})`,
  };
}

export async function dispatchShopifyGdprWebhook(params: {
  readonly topic: GdprTopic;
  readonly rawBody: string;
  readonly hmacHeader: string | undefined;
  readonly triggeredAtHeader?: string;
  readonly shopifyWebhookSecret: string;
  readonly store?: GdprStoreAdapter;
}): Promise<GdprHandlerResult> {
  const verification = verifyShopifyWebhookHmac(
    params.rawBody,
    params.hmacHeader,
    params.shopifyWebhookSecret,
    params.triggeredAtHeader,
  );

  if (!verification.valid) {
    throw new Error(`Invalid Shopify GDPR webhook signature: ${verification.reason ?? 'unknown'}`);
  }

  switch (params.topic) {
    case 'customers/data_request': {
      const payload = JSON.parse(params.rawBody) as ShopifyGdprCustomerDataRequest;
      return handleCustomersDataRequest(payload, params.store);
    }
    case 'customers/redact': {
      const payload = JSON.parse(params.rawBody) as ShopifyGdprCustomerRedact;
      return handleCustomersRedact(payload, params.store);
    }
    case 'shop/redact': {
      const payload = JSON.parse(params.rawBody) as ShopifyGdprShopRedact;
      return handleShopRedact(payload, params.store);
    }
  }
}
