import { Curve } from './Curves.js';
import type { propsType } from './Curves';

export class ArcCurve extends Curve {
  constructor(props: propsType) {
    super({ ...props, curveName: 'arc' });
  }
}
