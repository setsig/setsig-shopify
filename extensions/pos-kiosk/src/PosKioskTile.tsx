import { SETSIG_CLIENT_HEADER } from '../../../src/config.js';
import type { JsxElement } from '../../../src/jsx/jsx-runtime.js';
import type { PosDynamicTokenResponse, PosKioskTileProps } from '../../../src/types/index.js';

export function assertPublishableKey(key: string): void {
  if (!key.startsWith('pk_')) {
    throw new Error('Shopify POS Kiosk extension requires a publishable key (pk_live_ / pk_test_)');
  }
}

export async function fetchPosDynamicQrToken(
  apiBaseUrl: string,
  publishableKey: string,
  venueId: string,
): Promise<PosDynamicTokenResponse> {
  assertPublishableKey(publishableKey);
  const cleanBase = apiBaseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBase}/v1/venues/${encodeURIComponent(venueId)}/qr`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${publishableKey}`,
      'X-Setsig-Client': SETSIG_CLIENT_HEADER,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return {
      status: 'error',
      error: {
        code: `HTTP_${response.status}`,
        message: `Failed to fetch dynamic venue QR (${response.status})`,
      },
    };
  }

  return (await response.json()) as PosDynamicTokenResponse;
}

/**
 * Shopify POS UI Extension tile for in-store dynamic QR display.
 * Uses only publishable keys (`pk_live_`) — zero secret keys on POS devices.
 */
export function PosKioskTile(props: PosKioskTileProps): JsxElement {
  assertPublishableKey(props.publishableKey);
  const refreshMs = props.refreshIntervalMs ?? 30_000;

  return (
    <s-pos-tile
      title="setsig Check-In QR"
      subtitle={props.venueName}
      data-venue-id={props.venueId}
      data-api-base-url={props.apiBaseUrl}
      data-refresh-interval-ms={String(refreshMs)}
      enabled={true}
    />
  );
}
