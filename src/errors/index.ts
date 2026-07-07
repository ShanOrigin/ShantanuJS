import { NegativeValueError } from './domains/geometry/negative-value-error.js';
import { OutOfRangeError } from './domains/geometry/out-of-range-error.js';

import { InvalidOptionError } from './domains/common/invalid-option-error.js';
import { TypeMismatchError } from './domains/common/type-mismatch-error.js';
import { InvalidArgumentError } from './domains/common/invalid-argument-error.js';
import { InvalidReturnTypeError } from './domains/common/invalid-return-type-error.js';
import { OperationInProgressError } from './domains/common/operation-in-progress-error.js';
import { InvalidInternalStateError } from './domains/common/invalid-internal-state-error.js';
import { InvalidFormatError } from './domains/common/invalid-format-error.js';

import { CanvasParentNotFoundError } from './domains/canvas/canvas-parent-not-found-error.js';
import { ShapeAlreadyExistsInCanvasError } from './domains/canvas/shape-already-exists-in-canvas-error.js';
import { ShapeNotAttachedToCanvasError } from './domains/canvas/shape-not-attached-to-canvas-error.js';

import { MissingRequiredTransformParameterError } from './domains/transformation/missing-required-transform-parameter-error.js';

import { MissingRequiredAnimationParameterError } from './domains/animation/missing-required-animation-parameter-error.js';

import { ShapeAlreadyExistsInGroupError } from './domains/collection/shape-already-exists-in-group-error.js';

import { InvalidColorFormatError } from './domains/color/invalid-color-format-error.js';
import { InvalidNamedColorError } from './domains/color/invalid-named-color-error.js';

import { MissingRequiredCurveParameterError } from './domains/curve/missing-required-curve-parameter-error.js';

import { UnsupportedRenderingBackendError } from './domains/backend/unsupported-rendering-backend-error.js';
import { NotInitializedError } from './domains/engine/not-initialized-error.js';
import { InvalidRenderingContextError } from './domains/backend/invalid-rendering-context-error.js';
import { ReadOnlyPropertyError } from './domains/common/read-only-property-error.js';
import { InvalidRenderableShapeError } from './domains/engine/invalid-renderable-shape-error.js';
import { UnauthorizedInternalAccessError } from './domains/security/unauthorized-internal-access-error.js';
import { InvalidGroupMethodAccessError } from './domains/group/invalid-group-access-error.js';
import { ShapeNotAttachedToGroupError } from './domains/group/shape-not-attached-to-group-error.js';
import { DuplicateFilterError } from './domains/filter/duplicate-filter-error.js';
//import {  } from "./domains/";

export {
  NegativeValueError,
  OutOfRangeError,
  InvalidOptionError,
  TypeMismatchError,
  InvalidArgumentError,
  InvalidReturnTypeError,
  InvalidInternalStateError,
  OperationInProgressError,
  InvalidFormatError,
  CanvasParentNotFoundError,
  ShapeAlreadyExistsInCanvasError,
  ShapeNotAttachedToCanvasError,
  MissingRequiredTransformParameterError,
  MissingRequiredAnimationParameterError,
  ShapeAlreadyExistsInGroupError,
  InvalidNamedColorError,
  InvalidColorFormatError,
  MissingRequiredCurveParameterError,
  UnsupportedRenderingBackendError,
  NotInitializedError,
  InvalidRenderingContextError,
  ReadOnlyPropertyError,
  InvalidRenderableShapeError,
  UnauthorizedInternalAccessError,
  InvalidGroupMethodAccessError,
  ShapeNotAttachedToGroupError,
  DuplicateFilterError
};
