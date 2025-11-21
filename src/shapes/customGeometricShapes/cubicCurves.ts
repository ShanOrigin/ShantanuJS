import { Curve } from './Curves.js';
import type { propsType } from './Curves';

export class CubicCurve extends Curve {
  constructor(props: propsType) {
    super('cubic', {
      ...props,
      curveName: 'cubic',
      curvature: props.curvature || 0.5
    });
  }
}
