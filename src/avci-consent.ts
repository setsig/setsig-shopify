import type {
  AvciCmsConfig,
  AvciPreFilledConsentInput,
  AvciTermsModuleResult,
} from './types/index.js';

interface AvciTermsApiResponse {
  readonly status?: string;
  readonly data?: {
    readonly receipt_id?: string;
    readonly terms_version?: string;
    readonly recorded_at?: string;
  };
  readonly message?: string;
}

/**
 * Pre-Filled 1-step AVCI CMS TermsModule client.
 * Submits buyer consent acceptance using required AVCI authentication headers.
 */
export async function submitPreFilledAvciConsent(
  cmsConfig: AvciCmsConfig,
  input: AvciPreFilledConsentInput,
): Promise<AvciTermsModuleResult> {
  const language = input.language?.trim() || cmsConfig.defaultLanguage;
  const endpoint = `${cmsConfig.baseUrl}/v1/terms-module/consents/prefilled`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-avci-client': cmsConfig.client,
      'x-avci-secret': cmsConfig.secret,
      'x-avci-api-key': cmsConfig.apiKey,
      'x-avci-language': language,
    },
    body: JSON.stringify({
      subject_id: input.subjectId,
      email: input.email,
      full_name: input.fullName,
      terms_code: input.termsCode,
      external_reference: input.orderReference,
      accepted_at: input.acceptedAtIso,
      ip_address: input.ipAddress,
      flow: 'prefilled_one_step',
    }),
  });

  if (!response.ok) {
    throw new Error(`AVCI CMS TermsModule request failed with status ${response.status}`);
  }

  const parsed = (await response.json()) as AvciTermsApiResponse;
  if (!parsed.data?.receipt_id) {
    throw new Error(`AVCI CMS TermsModule returned invalid response: ${parsed.message ?? 'missing receipt_id'}`);
  }

  return {
    accepted: true,
    consentReceiptId: parsed.data.receipt_id,
    termsVersion: parsed.data.terms_version ?? '1.0',
    recordedAt: parsed.data.recorded_at ?? input.acceptedAtIso,
  };
}
