import { Curve } from './Curves.js';
import type { propsType } from './Curves';

export class QuadraticCurve extends Curve {
  constructor(props: propsType) {
    super({
      ...props,
      curveName: 'quadratic',
      curvature: props.curvature || 0.5
    });
  }
}
