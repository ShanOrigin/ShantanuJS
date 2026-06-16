import type {
  RESTORE_DIMENSION_METHOD,
  UPDATE_TRANSFORM_METHOD
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
