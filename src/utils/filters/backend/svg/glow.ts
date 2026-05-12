import {
  addTo,
  createSVGElement
} from '../../../../core/provider/svgSpecific.js';
import { generateId } from '../../../helpers/helpers.js';

/**
 * Creates an SVG glow effect filter definition.
 *
 * @param bright - Blur intensity controlling glow spread.
 * @returns Object containing the unique filter id and SVG <filter> element.
 */
export function svgGlow(bright: number) {
  const id = 'glow' + generateId('');
  const filter = createSVGElement('filter');
  filter.setAttribute('id', id);

  const feGaussianBlur = createSVGElement('feGaussianBlur');
  feGaussianBlur.setAttribute('in', 'SourceGraphic');
  feGaussianBlur.setAttribute('stdDeviation', String(bright));
  feGaussianBlur.setAttribute('result', 'coloredBlur');

  const feMerge = createSVGElement('feMerge');

  const feMergeNode0 = createSVGElement('feMergeNode');
  feMergeNode0.setAttribute('in', 'coloredBlur');

  const feMergeNode1 = createSVGElement('feMergeNode');
  feMergeNode1.setAttribute('in', 'SourceGraphic');

  addTo(feMerge, feMergeNode0);
  addTo(feMerge, feMergeNode1);

  addTo(filter, feGaussianBlur);
  addTo(filter, feMerge);

  return { id, filter };
}
