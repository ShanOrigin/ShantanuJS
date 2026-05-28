import type { Primitive, NativeTypedArray } from './common';

import {
  GET_INTERNAL_COMPUTED_STYLE_METHOD,
  GET_INTERNAL_GEOMETRY_METHOD,
  GET_INTERNAL_STYLE_METHOD
} from '../../internal/keys/dev-keys.js';

import type {
  ICommonGeometricProperties,
  TagToGShapeStyleKeyMap,
  StyleForGShapeTag
} from '../../property-definitions/common/common-properties';

import type { IGraphicalElementProperties } from '../../property-definitions/specific/specific-properties';
import type { DeepReadonly } from '../types/graphics-elements';

export type ValidGraphicsShapes = Extract<
  keyof IGraphicalElementProperties,
  keyof TagToGShapeStyleKeyMap
>;

export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends Function
  ? T
  : T extends NativeTypedArray
  ? T
  : T extends Array<infer U>
  ? ReadonlyArray<DeepReadonly<U>>
  : {
      readonly [K in keyof T]: DeepReadonly<T[K]>;
    };

export type InternalGeometry<T extends ValidGraphicsShapes> =
  ICommonGeometricProperties['geometry'] & IGraphicalElementProperties[T];

export type PublicGeometry<T extends ValidGraphicsShapes> = DeepReadonly<
  InternalGeometry<T>
>;

export type InternalStyle<T extends ValidGraphicsShapes> = StyleForGShapeTag<T>;

export type PublicStyle<T extends ValidGraphicsShapes> = DeepReadonly<
  InternalStyle<T>
>;

export type GRAPHICS_CONTEXT = 'SVG';

export type InternalGeometryAccessor = {
  [GET_INTERNAL_GEOMETRY_METHOD]: (
    key: symbol
  ) => InternalGeometry<ValidGraphicsShapes>;
};

export type InternalStyleAccessor = {
  [GET_INTERNAL_STYLE_METHOD]: (
    key: symbol
  ) => InternalStyle<ValidGraphicsShapes>;
};

export type InternalComputedStyleAccessor = {
  [GET_INTERNAL_COMPUTED_STYLE_METHOD]: (
    key: symbol
  ) => InternalStyle<ValidGraphicsShapes>;
};
