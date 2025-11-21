import { Curve } from './Curves.js';
import type { propsType } from './Curves';

export class EarcCurve extends Curve {
  constructor(props: propsType) {
    super('earc', {
      ...props,
      curveName: 'earc',
      curvature: props.curvature || 1
    });
  }
}
