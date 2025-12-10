import {
  EventsMixin,
  TransformMixin,
  AnimationMixin,
  FilterMixin
} from '../../mixins/provider/mixin.js';

import {
  GraphicalElement,
  GShpesTages
} from '../../core/graphics/providers/graphics.js';
import type { Constructor } from '../../mixins/mixinConstructor/mixinConstructor';

import { ValidKeys } from '../../core/graphics/graphics/graphicalElement';
// NOTE: You are missing imports for your mixins: TransformMixin, EventsMixin, AnimationMixin, FilterMixin.
// I will assume they are available and imported correctly for this example.

// FIX: Create a generic factory function that takes T and returns the Shape class.
export function createShapeClass<T extends GShpesTages>() {
  // Now, the mixin chain is inside a generic function,
  // and the T is correctly resolved for the base class expression.
  abstract class ShapeClass extends FilterMixin<
    T,
    Constructor<GraphicalElement<T>>
  >(
    AnimationMixin<T, Constructor<GraphicalElement<T>>>(
      EventsMixin<T, Constructor<GraphicalElement<T>>>(
        TransformMixin<T, Constructor<GraphicalElement<T>>>(GraphicalElement<T>)
      )
    )
  ) {
    // Note: If your mixins do not require a constructor body, you might not need one here.
    // If they do, you'll need to pass the arguments through:
    // constructor(...args: any[]) { super(...args); }
  }
  return ShapeClass;
}

type Caps = {
  Transform?: boolean;
  Events?: boolean;
  Animation?: boolean;
  Filter?: boolean;
};

function addCaps<T extends ValidKeys>(shape: T, caps: Caps) {
  let baseShape = GraphicalElement<T>;

  if (caps.Transform)
    baseShape = TransformMixin<T, Constructor<GraphicalElement<T>>>(baseShape);
  if (caps.Events)
    baseShape = EventsMixin<T, Constructor<GraphicalElement<T>>>(baseShape);
  if (caps.Animation)
    baseShape = AnimationMixin<T, Constructor<GraphicalElement<T>>>(baseShape);
  if (caps.Transform)
    baseShape = FilterMixin<T, Constructor<GraphicalElement<T>>>(baseShape);

  return baseShape;
}
