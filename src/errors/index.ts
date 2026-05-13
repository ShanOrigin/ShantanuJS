import { NegativeValueError } from './domains/geometry/NegativeValueError.js';
import { OutOfRangeError } from './domains/geometry/OutOfRangeError.js';

import { InvalidOptionError } from './domains/common/InvalidOptionError.js';
import { TypeMismatchError } from './domains/common/TypeMismatchError.js';
import { InvalidArgumentError } from './domains/common/InvalidArgumentError.js';
import { InvalidReturnTypeError } from './domains/common/InvalidReturnTypeError.js';
import { OperationInProgressError } from './domains/common/OperationInProgressError.js';
import { InvalidInternalStateError } from './domains/common/InvalidInternalStateError.js';
import { InvalidFormatError } from './domains/common/InvalidFormatError.js';

import { CanvasParentNotFoundError } from './domains/canvas/CanvasParentNotFoundError.js';
import { ShapeAlreadyExistsInCanvasError } from './domains/canvas/ShapeAlreadyExistsInCanvasError.js';
import { ShapeNotAttachedToCanvasError } from './domains/canvas/ShapeNotAttachedToCanvasError.js';

import { MissingRequiredTransformParameterError } from './domains/transformation/MissingRequiredTransformParameterError.js';

import { MissingRequiredAnimationParameterError } from './domains/animation/MissingRequiredAnimationParameterError.js';

import { ShapeAlreadyExistsInGroupError } from './domains/collection/ShapeAlreadyExistsInGroupError.js';

import { InvalidColorFormatError } from './domains/color/InvalidColorFormatError.js';
import { InvalidNamedColorError } from './domains/color/InvalidNamedColorError.js';

import { MissingRequiredCurveParameterError } from './domains/curve/MissingRequiredCurveParameterError.js';

import { UnsupportedRenderingBackendError } from './domains/backend/UnsupportedRenderingBackendError.js';
import { NotInitializedError } from './domains/engine/NotInitializedError.js';
import { InvalidRenderingContextError } from './domains/backend/InvalidRenderingContextError.js';
import { ReadOnlyPropertyError } from './domains/common/ReadOnlyPropertyError.js';
import { InvalidRenderableShapeError } from './domains/engine/InvalidRenderableShapeError.js';
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
  InvalidRenderableShapeError
};
