export type SetsigClientHeader = 'shopify/1.0.0';

export interface AvciCmsConfig {
  readonly baseUrl: string;
  readonly client: string;
  readonly secret: string;
  readonly apiKey: string;
  readonly defaultLanguage: string;
}

export interface ProductFilterConfig {
  readonly eligibleTags: readonly string[];
  readonly eligibleCollections: readonly string[];
}

export interface ShopifyIntegrationConfig {
  readonly setsigApiBaseUrl: string;
  readonly setsigMarketingBaseUrl: string;
  readonly setsigSecretKey: string;
  readonly setsigPublishableKey: string;
  readonly setsigWebhookSecret: string;
  readonly checkInTokenSecret: string;
  readonly defaultVenueId: string;
  readonly shopifyClientId: string;
  readonly shopifyClientSecret: string;
  readonly shopifyWebhookSecret: string;
  readonly shopifyAppUrl: string;
  readonly shopifyApiVersion: string;
  readonly filter: ProductFilterConfig;
  readonly avciCms: AvciCmsConfig;
}

export interface ShopifyProductCandidate {
  readonly productId: string;
  readonly title: string;
  readonly tags: readonly string[];
  readonly collections: readonly string[];
  readonly requiresShipping?: boolean;
}

export interface ShopifyOrderLineItem {
  readonly id: string;
  readonly productId: string;
  readonly title: string;
  readonly quantity: number;
  readonly tags: readonly string[];
  readonly collections: readonly string[];
  readonly requiresShipping?: boolean;
}

export interface FilterEvaluationResult {
  readonly eligible: boolean;
  readonly matchedItems: readonly ShopifyOrderLineItem[];
  readonly skippedItems: readonly ShopifyOrderLineItem[];
  readonly matchedReasons: readonly string[];
}

export interface CheckInTokenPayload {
  readonly orderId: string;
  readonly shopDomain: string;
  readonly venueId: string;
  readonly customerEmailHash: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
}

export interface WebhookVerificationResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly timestamp?: number;
}

export interface SetsigVerificationProof {
  readonly sessionId: string;
  readonly status: 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  readonly proofSignature: string;
  readonly venueId: string;
  readonly verifiedAt: string;
  readonly externalReference: string;
}

export interface ShopifyGraphQLConfig {
  readonly shopDomain: string;
  readonly adminAccessToken: string;
  readonly apiVersion: string;
}

export interface ShopifyUserError {
  readonly field: readonly string[] | null;
  readonly message: string;
}

export interface ShopifyMetafieldSyncResult {
  readonly orderGid: string;
  readonly metafieldsUpdated: number;
  readonly tagAdded: boolean;
  readonly errors: readonly ShopifyUserError[];
}

export interface ShopifyGdprCustomerDataRequest {
  readonly shop_id: number;
  readonly shop_domain: string;
  readonly orders_requested: readonly number[];
  readonly customer: {
    readonly id: number;
    readonly email: string;
    readonly phone?: string;
  };
  readonly data_request: {
    readonly id: number;
  };
}

export interface ShopifyGdprCustomerRedact {
  readonly shop_id: number;
  readonly shop_domain: string;
  readonly customer: {
    readonly id: number;
    readonly email: string;
    readonly phone?: string;
  };
  readonly orders_to_redact: readonly number[];
}

export interface ShopifyGdprShopRedact {
  readonly shop_id: number;
  readonly shop_domain: string;
}

export type GdprTopic = 'customers/data_request' | 'customers/redact' | 'shop/redact';

export interface GdprHandlerResult {
  readonly topic: GdprTopic;
  readonly shopDomain: string;
  readonly acknowledged: boolean;
  readonly processedAt: string;
  readonly auditNote: string;
}

export interface GdprStoreAdapter {
  readonly exportCustomerRecords: (shopDomain: string, customerId: number, orderIds: readonly number[]) => Promise<Record<string, unknown>>;
  readonly eraseCustomerRecords: (shopDomain: string, customerId: number, orderIds: readonly number[]) => Promise<void>;
  readonly eraseShopRecords: (shopDomain: string) => Promise<void>;
}

export interface AvciPreFilledConsentInput {
  readonly subjectId: string;
  readonly email: string;
  readonly fullName?: string;
  readonly termsCode: string;
  readonly orderReference: string;
  readonly language?: string;
  readonly acceptedAtIso: string;
  readonly ipAddress?: string;
}

export interface AvciTermsModuleResult {
  readonly accepted: boolean;
  readonly consentReceiptId: string;
  readonly termsVersion: string;
  readonly recordedAt: string;
}

export interface OrderStatusBlockProps {
  readonly orderId: string;
  readonly orderName: string;
  readonly marketingBaseUrl: string;
  readonly checkInToken: string;
  readonly venueName: string;
  readonly status: 'PENDING' | 'VERIFIED' | 'EXPIRED';
  readonly locale?: 'en' | 'tr' | 'de' | 'ar';
}

export interface PosKioskTileProps {
  readonly apiBaseUrl: string;
  readonly publishableKey: string;
  readonly venueId: string;
  readonly venueName: string;
  readonly refreshIntervalMs?: number;
}

export interface PosDynamicTokenResponse {
  readonly status: 'success' | 'error';
  readonly data?: {
    readonly token: string;
    readonly expires_at: string;
    readonly venue_id: string;
    readonly qr_payload: string;
  };
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}
