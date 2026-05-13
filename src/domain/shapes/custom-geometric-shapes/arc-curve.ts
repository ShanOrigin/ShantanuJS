import { Curve } from './Curve.js';
import type { propsType } from './Curve';

export class ArcCurve extends Curve {
  constructor(props: propsType) {
    super('arc', {
      ...props,
      curveName: 'arc',
      curvature: props.curvature || 1
    });
  }
}
