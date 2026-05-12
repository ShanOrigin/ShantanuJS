import { Curve } from './Curve.js';
import type { propsType } from './Curve';

export class CubicCurve extends Curve {
  constructor(props: propsType) {
    super('cubic', {
      ...props,
      curveName: 'cubic',
      curvature: props.curvature || 0.5
    });
  }
}
