import type { ConstructorPropsTypes } from '../../../models/types/common';
import { Curve } from './curve.js';

export class CubicCurve extends Curve {
  constructor(props: Omit<ConstructorPropsTypes<'curve'>, 'curveName'>) {
    super({
      ...props,
      curveName: 'cubic',
      curvature: props.curvature || 0.5
    });
  }
}
