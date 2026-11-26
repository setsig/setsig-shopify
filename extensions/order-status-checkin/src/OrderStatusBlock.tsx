import { buildCheckInVerificationUrl } from '../../../src/hmac.js';
import type { JsxElement } from '../../../src/jsx/jsx-runtime.js';
import type { OrderStatusBlockProps } from '../../../src/types/index.js';

interface CopyBundle {
  readonly heading: string;
  readonly description: string;
  readonly ctaLabel: string;
  readonly verifiedLabel: string;
  readonly expiredLabel: string;
}

const COPY_BY_LOCALE: Readonly<Record<'en' | 'tr' | 'de' | 'ar', CopyBundle>> = {
  en: {
    heading: 'Physical Check-In Pass',
    description: 'Complete cryptographic presence verification when you arrive at the venue.',
    ctaLabel: 'Open Check-In Pass',
    verifiedLabel: 'Physical presence verified',
    expiredLabel: 'Check-in pass expired',
  },
  tr: {
    heading: 'Fiziksel Giriş Kartı',
    description: 'Mekana vardığınızda kriptografik fiziksel varlık doğrulamanızı tamamlayın.',
    ctaLabel: 'Doğrulama Ekranını Aç',
    verifiedLabel: 'Fiziksel varlık doğrulandı',
    expiredLabel: 'Giriş kartı süresi doldu',
  },
  de: {
    heading: 'Physischer Check-In-Pass',
    description: 'Schließen Sie die kryptografische Anwesenheitsprüfung bei Ihrer Ankunft ab.',
    ctaLabel: 'Check-In öffnen',
    verifiedLabel: 'Physische Anwesenheit bestätigt',
    expiredLabel: 'Check-In-Pass abgelaufen',
  },
  ar: {
    heading: 'بطاقة التحقق الحضوري',
    description: 'أكمل التحقق التشفيري من الحضور الفعلي عند وصولك إلى الموقع.',
    ctaLabel: 'فتح صفحة التحقق',
    verifiedLabel: 'تم التحقق من الحضور الفعلي',
    expiredLabel: 'انتهت صلاحية بطاقة التحقق',
  },
};

/**
 * Shopify Thank You & Order Status UI Extension.
 * Links buyers directly to `${marketingBaseUrl}/verify/[token]` without exposing any secret key.
 */
export function OrderStatusBlock(props: OrderStatusBlockProps): JsxElement {
  const copy = COPY_BY_LOCALE[props.locale ?? 'en'];
  const verifyUrl = buildCheckInVerificationUrl(props.marketingBaseUrl, props.checkInToken);

  return (
    <s-section heading={copy.heading} data-order-id={props.orderId}>
      <s-stack direction="block" gap="base">
        <s-text>
          {props.venueName} — {props.orderName}
        </s-text>
        <s-text tone="subdued">{copy.description}</s-text>
        {props.status === 'VERIFIED' ? (
          <s-badge tone="success">{copy.verifiedLabel}</s-badge>
        ) : props.status === 'EXPIRED' ? (
          <s-badge tone="critical">{copy.expiredLabel}</s-badge>
        ) : (
          <s-link href={verifyUrl} external={true}>
            {copy.ctaLabel}
          </s-link>
        )}
      </s-stack>
    </s-section>
  );
}
