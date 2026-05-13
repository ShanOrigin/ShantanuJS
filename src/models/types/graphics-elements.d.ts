export type DeepReadonly<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R // functions stay as functions
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

export type CONTEXT = 'svg' | null;
// In future CONTEXT would be SVG_CONTEXT , 'htmlcanvas' , 'webgl'
