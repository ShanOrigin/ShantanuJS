import type { ConstructorPropsTypes } from '../../../models/types/common';
import { Curve } from './curve.js';

export class EarcCurve extends Curve {
  constructor(props: Omit<ConstructorPropsTypes<'curve'>, 'curveName'>) {
    super({
      ...props,
      curveName: 'earc',
      curvature: props.curvature || 1
    });
  }
}
