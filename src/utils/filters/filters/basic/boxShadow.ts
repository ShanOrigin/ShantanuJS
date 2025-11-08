import { propertyUpdate, appendChildren } from '../../helpers/helpers.js';
import { createSVGElement } from '../../../dom/dom.js';

import { boxShadowProps } from '../../../../types/filters.d';
import { generateId } from '../../../helpers/helpers.js';

export function boxShadow(props: boxShadowProps) {
  const { blur, offsetX, offsetY, color, opacity = 0.5 } = props;

  const id = 'boxShadow' + generateId('');
  const filter = createSVGElement('filter');
  filter.setAttribute('id', id);
  // Gaussian blur
  const feGaussianBlur = createSVGElement('feGaussianBlur');
  propertyUpdate(feGaussianBlur, {
    in: 'SourceAlpha',
    stdDeviation: blur
  });

  // Offset
  const feOffset = createSVGElement('feOffset');
  propertyUpdate(feOffset, {
    dx: offsetX,
    dy: offsetY,
    result: 'offsetblur'
  });

  // Flood
  const feFlood = createSVGElement('feFlood');
  propertyUpdate(feFlood, {
    'flood-color': color,
    'flood-opacity': opacity
  });

  // Composite
  const feComposite = createSVGElement('feComposite');
  propertyUpdate(feComposite, { in2: 'offsetblur', operator: 'in' });

  // Merge
  const feMerge = createSVGElement('feMerge');
  const feMergeNode0 = createSVGElement('feMergeNode');
  const feMergeNode1 = createSVGElement('feMergeNode');
  feMergeNode1.setAttribute('in', 'SourceGraphic');

  // 🔹 Append chain using helper
  appendChildren(feMerge, feMergeNode0, feMergeNode1);
  appendChildren(
    filter,
    feGaussianBlur,
    feOffset,
    feFlood,
    feComposite,
    feMerge
  );

  const filterComp = {
    feGaussianBlur,
    feOffset,
    feFlood,
    feComposite,
    feMerge,
    feMergeNode0,
    feMergeNode1
  } as object;

  return { id, filter, filterComp };
}
