import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { CheckInTokenPayload, WebhookVerificationResult } from './types/index.js';

const REPLAY_WINDOW_SECONDS = 300;

function constantTimeCompareStrings(expected: string, actual: string): boolean {
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(actual, 'utf8');
  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Verifies Shopify's `X-Shopify-Hmac-Sha256` webhook signature using constant-time comparison.
 * Optional `triggeredAtIso` (`X-Shopify-Triggered-At`) enforces the 300-second replay window.
 */
export function verifyShopifyWebhookHmac(
  rawBody: string | Buffer,
  hmacHeader: string | undefined,
  webhookSecret: string,
  triggeredAtIso?: string,
  nowMs: number = Date.now(),
): WebhookVerificationResult {
  if (!hmacHeader || hmacHeader.trim().length === 0) {
    return { valid: false, reason: 'missing_shopify_hmac_header' };
  }

  if (triggeredAtIso) {
    const triggeredMs = Date.parse(triggeredAtIso);
    if (Number.isNaN(triggeredMs)) {
      return { valid: false, reason: 'invalid_shopify_triggered_at' };
    }
    const deltaSeconds = Math.abs(Math.floor(nowMs / 1000) - Math.floor(triggeredMs / 1000));
    if (deltaSeconds > REPLAY_WINDOW_SECONDS) {
      return { valid: false, reason: 'replay_window_exceeded' };
    }
  }

  const digestBase64 = createHmac('sha256', webhookSecret).update(rawBody).digest('base64');
  const valid = constantTimeCompareStrings(digestBase64, hmacHeader.trim());
  return valid
    ? { valid: true, timestamp: Math.floor(nowMs / 1000) }
    : { valid: false, reason: 'hmac_mismatch' };
}

/**
 * Verifies setsig's `X-Setsig-Signature` (`t=<unix>,v1=<hex>`) header using
 * `crypto.timingSafeEqual` and a strict 300-second replay window.
 */
export function verifySetsigWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  webhookSecret: string,
  nowMs: number = Date.now(),
): WebhookVerificationResult {
  if (!signatureHeader || signatureHeader.trim().length === 0) {
    return { valid: false, reason: 'missing_setsig_signature' };
  }

  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, segment) => {
    const [key, value] = segment.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const timestampRaw = parts.t;
  const providedSig = parts.v1;
  if (!timestampRaw || !providedSig) {
    return { valid: false, reason: 'malformed_setsig_signature' };
  }

  const timestamp = Number.parseInt(timestampRaw, 10);
  if (!Number.isFinite(timestamp)) {
    return { valid: false, reason: 'invalid_timestamp' };
  }

  const nowSeconds = Math.floor(nowMs / 1000);
  if (Math.abs(nowSeconds - timestamp) > REPLAY_WINDOW_SECONDS) {
    return { valid: false, reason: 'replay_window_exceeded' };
  }

  const signedPayload = `t=${timestamp}.${rawBody}`;
  const expectedHex = createHmac('sha256', webhookSecret).update(signedPayload, 'utf8').digest('hex');

  const valid = constantTimeCompareStrings(expectedHex, providedSig.toLowerCase());
  return valid ? { valid: true, timestamp } : { valid: false, reason: 'signature_mismatch' };
}

export function hashCustomerEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase(), 'utf8').digest('hex');
}

/**
 * Signs a stateless URL-safe check-in token for `${MARKETING_BASE_URL}/verify/[token]`.
 */
export function signCheckInToken(payload: CheckInTokenPayload, secret: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(encodedPayload, 'utf8').digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyCheckInToken(
  token: string,
  secret: string,
  nowMs: number = Date.now(),
): { readonly valid: boolean; readonly payload?: CheckInTokenPayload; readonly reason?: string } {
  const segments = token.split('.');
  if (segments.length !== 2) {
    return { valid: false, reason: 'malformed_token' };
  }

  const [encodedPayload, providedSig] = segments;
  if (!encodedPayload || !providedSig) {
    return { valid: false, reason: 'malformed_token' };
  }

  const expectedSig = createHmac('sha256', secret).update(encodedPayload, 'utf8').digest('base64url');
  if (!constantTimeCompareStrings(expectedSig, providedSig)) {
    return { valid: false, reason: 'invalid_token_signature' };
  }

  try {
    const decoded = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as CheckInTokenPayload;
    const nowSeconds = Math.floor(nowMs / 1000);
    if (decoded.expiresAt < nowSeconds) {
      return { valid: false, reason: 'token_expired' };
    }
    return { valid: true, payload: decoded };
  } catch {
    return { valid: false, reason: 'invalid_token_payload' };
  }
}

export function buildCheckInVerificationUrl(marketingBaseUrl: string, token: string): string {
  const cleanBase = marketingBaseUrl.replace(/\/+$/, '');
  return `${cleanBase}/verify/${encodeURIComponent(token)}`;
}
