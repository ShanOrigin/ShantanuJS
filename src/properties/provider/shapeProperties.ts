// Importing Values
import {
  //  CommonStyleProperties,
  CommonGeometricProperties,
  AllGShapeStyleProperties,
  AllStyleProperties
} from '../common/commonProperties.js';

import {
  GraphicalElementProperties,
  NonGraphicalElementProperties,
  dimensions
} from '../specific/specificProperties.js';

// Importing Types
import type {
  //  ICommonStyleProperties,
  ICommonGeometricProperties,
  IAllGShapeStyleProperties,
  TagToGShapeStyleKeyMap,
  StyleForGShapeTag,
  IAllStyleProperties
} from '../common/commonProperties';

import type {
  IGraphicalElementProperties,
  INonGraphicalElementProperties,
  ipDot,
  ipCanvas,
  ipLine,
  ipRect,
  ipText,
  ipImage,
  ipCircle,
  ipEllipse,
  ipPolygon,
  ipPolyline,
  ipPath
} from '../specific/specificProperties';

export {
  // CommonStyleProperties,
  CommonGeometricProperties,
  AllGShapeStyleProperties,
  GraphicalElementProperties,
  NonGraphicalElementProperties,
  dimensions,
  AllStyleProperties
};

export type {
  // ICommonStyleProperties,
  IAllStyleProperties,
  ICommonGeometricProperties,
  IAllGShapeStyleProperties,
  TagToGShapeStyleKeyMap,
  StyleForGShapeTag,
  IGraphicalElementProperties,
  INonGraphicalElementProperties,
  ipDot,
  ipLine,
  ipRect,
  ipCircle,
  ipEllipse,
  ipPolygon,
  ipPolyline,
  ipPath,
  ipCanvas,
  ipText,
  ipImage
};
