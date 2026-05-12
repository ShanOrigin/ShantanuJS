import { Curve } from './Curve.js';
import type { propsType } from './Curve';

export class EarcCurve extends Curve {
  constructor(props: propsType) {
    super('earc', {
      ...props,
      curveName: 'earc',
      curvature: props.curvature || 1
    });
  }
}
