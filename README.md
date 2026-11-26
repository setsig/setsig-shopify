# @setsig/shopify

Official setsig Proof-of-Physical-Presence integration for Shopify merchants running physical events, workshops, venues, and in-store pick-ups.

## Features

- **Product Eligibility Filtering (`src/filters.ts`)**: Evaluates Shopify order line items against configured product tags (e.g., `bilet`, `workshop`, `etkinlik`) and collection handles, skipping standard physical merchandise automatically.
- **Cryptographic Webhook & Token Security (`src/hmac.ts`)**:
  - Constant-time (`crypto.timingSafeEqual`) Shopify HMAC-SHA256 webhook verification.
  - Constant-time setsig `X-Setsig-Signature` verification with 300-second replay protection.
  - Stateless HMAC-SHA256 check-in token signing for `${SETSIG_MARKETING_BASE_URL}/verify/[token]`.
- **Shopify Admin GraphQL Sync (`src/shopify-graphql.ts`)**: Persists `setsig.status`, `setsig.session_id`, and `setsig.proof_signature` metafields and appends the `setsig-checked-in` order tag upon physical presence verification.
- **Mandatory GDPR Compliance (`src/gdpr.ts`)**: Handles `customers/data_request`, `customers/redact`, and `shop/redact` webhooks cleanly.
- **Pre-Filled 1-Step Consent (`src/avci-consent.ts`)**: Integrates with AVCI CMS `TermsModule` via `x-avci-client`, `x-avci-secret`, `x-avci-api-key`, and `x-avci-language`.
- **Storefront & POS Extensions**:
  - `extensions/order-status-checkin/src/OrderStatusBlock.tsx`: Thank You & Order Status extension linking buyers to their stateless check-in link (no secret keys exposed).
  - `extensions/pos-kiosk/src/PosKioskTile.tsx`: Shopify POS UI extension displaying live venue dynamic QR tokens using `pk_live_` only.

## Configuration

Copy `.env.example` to `.env` and populate all environment variables. No service URLs are hardcoded in source files.

## Typecheck & Build

```bash
npm run typecheck
npm run build
```
