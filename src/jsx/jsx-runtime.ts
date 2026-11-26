export interface JsxElement {
  readonly type: string | ((props: Record<string, unknown>) => JsxElement);
  readonly props: Record<string, unknown>;
}

export type JsxChild = JsxElement | string | number | boolean | null | undefined | readonly JsxChild[];

export namespace JSX {
  export type Element = JsxElement;
  export interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
}

export function jsx(
  type: string | ((props: Record<string, unknown>) => JsxElement),
  props: Record<string, unknown>,
): JsxElement {
  return { type, props };
}

export const jsxs = jsx;

export function Fragment(props: { readonly children?: JsxChild }): JsxElement {
  return { type: 'Fragment', props };
}
