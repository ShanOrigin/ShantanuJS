import type {
  RESTORE_DIMENSION_METHOD,
  UPDATE_TRANSFORM_METHOD,
  GENERATE_CANONICAL_MATRIX_AND_BOUNDS_METHOD,
  UPDATE_ANIMATION_METHOD
} from '../../internal/keys/render-node-keys';
import { UpdateAnimationReturnType } from './animation/options';

export type InternalRestoreDimensionMethodAccessor = {
  [RESTORE_DIMENSION_METHOD]: (
    key: symbol,
    temporaryState: Float32Array
  ) => void;
};

export type InternalUpdateTransformMethodAccessor = {
  [UPDATE_TRANSFORM_METHOD]: (key: symbol) => void;
};
export type InternalUpdateAnimationMethodAccessor = {
  [UPDATE_ANIMATION_METHOD]: (
    time: number,
    key: symbol
  ) => UpdateAnimationReturnType;
};

export type InternalGenerateCMatrixAndBoundMethodAccessor = {
  [GENERATE_CANONICAL_MATRIX_AND_BOUNDS_METHOD]: (
    bbox: DOMRect | null,
    setCMatrix: boolean,
    accessKey: symbol
  ) => void;
};
