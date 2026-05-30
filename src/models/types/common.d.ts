import { StyleForGShapeTag } from '../../property-definitions/common/common-properties';
import { IGraphicalElementProperties } from '../../property-definitions/specific/specific-properties';
import type { ValidGraphicsShapes } from './graphics-model';

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

export type InternalKeys =
  | 'id'
  | 'localDirty'
  | 'worldDirty'
  | 'inverseWorldMatrix'
  | 'shape'
  | 'zIndex'
  | 'buffer'
  | 'parentMatrix'
  | 'localMatrix'
  | 'transformStack';

export type AttrsMethodPropsTypes<T extends ValidGraphicsShapes> = Partial<
  IGraphicalElementProperties[T]
> &
  Partial<Omit<StyleForGShapeTag<T>, InternalKeys>>;

export type ConstructorPropsTypes<T extends ValidGraphicsShapes> = Partial<
  IGraphicalElementProperties[T]
> &
  Partial<StyleForGShapeTag<T>>;

export type InitialProps = { initial?: boolean };
