import type {
  RESTORE_DIMENSION_METHOD,
  UPDATE_TRANSFORM_METHOD,
  GENERATE_CANONICAL_MATRIX_AND_BOUNDS_METHOD
} from '../../internal/keys/render-node-keys';

export type InternalRestoreDimensionMethodAccessor = {
  [RESTORE_DIMENSION_METHOD]: (
    key: symbol,
    temporaryState: Float32Array
  ) => void;
};

export type InternalUpdateTransformMethodAccessor = {
  [UPDATE_TRANSFORM_METHOD]: (key: symbol) => void;
};

export type InternalGenerateCMatrixAndBoundMethodAccessor = {
  [GENERATE_CANONICAL_MATRIX_AND_BOUNDS_METHOD]: (
    key: symbol,
    rendererBBox: DOMRect
  ) => void;
};
