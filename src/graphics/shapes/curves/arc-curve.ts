import type { AttrsMethodPropsTypes } from '../../../models/types/common';
import { Curve } from './curve.js';

export class ArcCurve extends Curve {
  constructor(props: AttrsMethodPropsTypes<'curve'>) {
    super({
      ...props,
      curveName: 'arc',
      curvature: props.curvature || 1
    });
  }
}
