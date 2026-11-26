import type {
  FilterEvaluationResult,
  ProductFilterConfig,
  ShopifyOrderLineItem,
  ShopifyProductCandidate,
} from './types/index.js';

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export function matchProductEligibility(
  product: ShopifyProductCandidate,
  config: ProductFilterConfig,
): { readonly matched: boolean; readonly reason?: string } {
  const allowedTags = new Set(config.eligibleTags.map(normalizeToken));
  const allowedCollections = new Set(config.eligibleCollections.map(normalizeToken));

  for (const tag of product.tags) {
    const normalized = normalizeToken(tag);
    if (allowedTags.has(normalized)) {
      return { matched: true, reason: `tag:${normalized}` };
    }
  }

  for (const collection of product.collections) {
    const normalized = normalizeToken(collection);
    if (allowedCollections.has(normalized)) {
      return { matched: true, reason: `collection:${normalized}` };
    }
  }

  return { matched: false };
}

export function filterEligibleOrderItems(
  lineItems: readonly ShopifyOrderLineItem[],
  config: ProductFilterConfig,
): FilterEvaluationResult {
  const matchedItems: ShopifyOrderLineItem[] = [];
  const skippedItems: ShopifyOrderLineItem[] = [];
  const matchedReasons: string[] = [];

  for (const item of lineItems) {
    const result = matchProductEligibility(item, config);
    if (result.matched && result.reason) {
      matchedItems.push(item);
      matchedReasons.push(`${item.productId}:${result.reason}`);
    } else {
      skippedItems.push(item);
    }
  }

  return {
    eligible: matchedItems.length > 0,
    matchedItems,
    skippedItems,
    matchedReasons,
  };
}
