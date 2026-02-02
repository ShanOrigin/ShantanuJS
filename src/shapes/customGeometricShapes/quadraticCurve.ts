import { Curve } from './Curve.js';
import type { propsType } from './Curve';

export class QuadraticCurve extends Curve {
  constructor(props: propsType) {
    super('quadratic', {
      ...props,
      curveName: 'quadratic',
      curvature: props.curvature || 0.5
    });
  }
}
