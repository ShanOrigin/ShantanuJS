import type { AttrsMethodPropsTypes } from '../../../models/types/common';
import { Curve } from './curve.js';

export class EarcCurve extends Curve {
  constructor(props: AttrsMethodPropsTypes<'curve'>) {
    super({
      ...props,
      curveName: 'earc',
      curvature: props.curvature || 1
    });
  }
}
