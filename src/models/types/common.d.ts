export type GRAPHICS_TYPES = SVGElement;

export type GetAttrsMethodsReturnTypes =
  | string
  | number
  | Float32Array
  | object
  | undefined;

export type AttrsMethodReturnTypes =
  | void
  | GetAttrsMethodsReturnTypes[]
  | GetAttrsMethodsReturnTypes;

export type TransformStack = {
  stack: Float32Array[];
  skip: number;
};

export type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | undefined
  | null;

export type NativeTypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;
