import {
  createSVGElement,
  addTo
} from '../../../../core/provider/svgSpecific.js';

import { boxShadowProps } from '../../../../types/filters.d';
import { generateId } from '../../../helpers/helpers.js';

/**
 * Creates an SVG box shadow (drop shadow) filter definition.
 *
 * @param props - Shadow configuration (blur, offsets, color, opacity).
 * @returns Object containing the unique filter id and SVG <filter> element.
 */
export function svgBoxShadow(props: boxShadowProps) {
  const { blur, offsetX, offsetY, color, opacity = 0.5 } = props;

  const id = 'boxShadow' + generateId('');
  const filter = createSVGElement('filter');
  filter.setAttribute('id', id);

  const feGaussianBlur = createSVGElement('feGaussianBlur');
  feGaussianBlur.setAttribute('in', 'SourceAlpha');
  feGaussianBlur.setAttribute('stdDeviation', String(blur));
  feGaussianBlur.setAttribute('result', 'blur');

  const feOffset = createSVGElement('feOffset');
  feOffset.setAttribute('in', 'blur');
  feOffset.setAttribute('dx', String(offsetX));
  feOffset.setAttribute('dy', String(offsetY));
  feOffset.setAttribute('result', 'offsetblur');

  const feFlood = createSVGElement('feFlood');
  feFlood.setAttribute('flood-color', color);
  feFlood.setAttribute('flood-opacity', String(opacity));
  feFlood.setAttribute('result', 'color');

  const feComposite = createSVGElement('feComposite');
  feComposite.setAttribute('in', 'color');
  feComposite.setAttribute('in2', 'offsetblur');
  feComposite.setAttribute('operator', 'in');
  feComposite.setAttribute('result', 'shadow');

  const feMerge = createSVGElement('feMerge');

  const feMergeNode0 = createSVGElement('feMergeNode');
  feMergeNode0.setAttribute('in', 'shadow');

  const feMergeNode1 = createSVGElement('feMergeNode');
  feMergeNode1.setAttribute('in', 'SourceGraphic');

  addTo(feMerge, feMergeNode0);
  addTo(feMerge, feMergeNode1);

  addTo(filter, feGaussianBlur);
  addTo(filter, feOffset);
  addTo(filter, feFlood);
  addTo(filter, feComposite);
  addTo(filter, feMerge);

  return { id, filter };
}
