import type { AttrsMethodPropsTypes } from '../../../models/types/common';
import { Curve } from './curve.js';

export class QuadraticCurve extends Curve {
  constructor(props: AttrsMethodPropsTypes<'curve'>) {
    super({
      ...props,
      curveName: 'quadratic',
      curvature: props.curvature || 0.5
    });
  }
}
