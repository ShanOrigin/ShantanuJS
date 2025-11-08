export type getAttrsMethodsReturnTypes =
  | string
  | number
  | Float32Array
  | Float32Array[]
  | undefined;

export type attrsMethodReturnTypes =
  | void
  | getAttrsMethodsReturnTypes[]
  | getAttrsMethodsReturnTypes;
