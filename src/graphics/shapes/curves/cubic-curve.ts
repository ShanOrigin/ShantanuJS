import type { AttrsMethodPropsTypes } from '../../../models/types/common';
import { Curve } from './curve.js';

export class CubicCurve extends Curve {
  constructor(props: AttrsMethodPropsTypes<'curve'>) {
    super({
      ...props,
      curveName: 'cubic',
      curvature: props.curvature || 0.5
    });
  }
}
