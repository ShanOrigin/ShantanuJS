import { Curve } from './Curves.js';
import type { propsType } from './Curves';

export class ArcCurve extends Curve {
  constructor(props: propsType) {
    super('arc', {
      ...props,
      curveName: 'arc',
      curvature: props.curvature || 1
    });
  }
}
