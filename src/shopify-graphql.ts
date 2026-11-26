import type {
  SetsigVerificationProof,
  ShopifyGraphQLConfig,
  ShopifyMetafieldSyncResult,
  ShopifyUserError,
} from './types/index.js';

const METAFIELDS_AND_TAG_MUTATION = `
  mutation SetsigSyncOrderCheckIn($metafields: [MetafieldsSetInput!]!, $orderId: ID!, $tags: [String!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        value
      }
      userErrors {
        field
        message
      }
    }
    tagsAdd(id: $orderId, tags: $tags) {
      node {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

interface GraphQLSyncResponse {
  readonly data?: {
    readonly metafieldsSet?: {
      readonly metafields: readonly { readonly id: string }[];
      readonly userErrors: readonly ShopifyUserError[];
    };
    readonly tagsAdd?: {
      readonly node: { readonly id: string } | null;
      readonly userErrors: readonly ShopifyUserError[];
    };
  };
  readonly errors?: readonly { readonly message: string }[];
}

export function toOrderGid(orderIdOrGid: string): string {
  if (orderIdOrGid.startsWith('gid://shopify/Order/')) {
    return orderIdOrGid;
  }
  return `gid://shopify/Order/${orderIdOrGid}`;
}

export async function syncVerificationProofToShopifyOrder(
  graphqlConfig: ShopifyGraphQLConfig,
  orderIdOrGid: string,
  proof: SetsigVerificationProof,
): Promise<ShopifyMetafieldSyncResult> {
  const orderGid = toOrderGid(orderIdOrGid);
  const endpoint = `https://${graphqlConfig.shopDomain}/admin/api/${graphqlConfig.apiVersion}/graphql.json`;

  const variables = {
    orderId: orderGid,
    tags: proof.status === 'VERIFIED' ? ['setsig-checked-in'] : [],
    metafields: [
      {
        ownerId: orderGid,
        namespace: 'setsig',
        key: 'status',
        type: 'single_line_text_field',
        value: proof.status,
      },
      {
        ownerId: orderGid,
        namespace: 'setsig',
        key: 'session_id',
        type: 'single_line_text_field',
        value: proof.sessionId,
      },
      {
        ownerId: orderGid,
        namespace: 'setsig',
        key: 'proof_signature',
        type: 'single_line_text_field',
        value: proof.proofSignature,
      },
    ],
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': graphqlConfig.adminAccessToken,
    },
    body: JSON.stringify({
      query: METAFIELDS_AND_TAG_MUTATION,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Shopify Admin GraphQL request failed with status ${response.status}`);
  }

  const body = (await response.json()) as GraphQLSyncResponse;
  if (body.errors && body.errors.length > 0) {
    const messages = body.errors.map((err) => err.message).join('; ');
    throw new Error(`Shopify Admin GraphQL returned errors: ${messages}`);
  }

  const metafieldErrors = body.data?.metafieldsSet?.userErrors ?? [];
  const tagErrors = body.data?.tagsAdd?.userErrors ?? [];

  return {
    orderGid,
    metafieldsUpdated: body.data?.metafieldsSet?.metafields.length ?? 0,
    tagAdded: proof.status === 'VERIFIED' && tagErrors.length === 0 && body.data?.tagsAdd?.node !== null,
    errors: [...metafieldErrors, ...tagErrors],
  };
}
