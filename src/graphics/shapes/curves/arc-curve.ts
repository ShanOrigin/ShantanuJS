import type { ConstructorPropsTypes } from '../../../models/types/common';
import { Curve } from './curve.js';

export class ArcCurve extends Curve {
  constructor(props: Omit<ConstructorPropsTypes<'curve'>, 'curveName'>) {
    super({
      ...props,
      curveName: 'arc',
      curvature: props.curvature || 1
    });
  }
}
