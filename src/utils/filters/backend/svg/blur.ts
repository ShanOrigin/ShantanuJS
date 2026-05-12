import { generateId } from '../../../helpers/helpers.js';
import {
  createSVGElement,
  addTo
} from '../../../../core/provider/svgSpecific.js';

/**
 * Creates an SVG Gaussian blur filter definition.
 *
 * @param blur - Standard deviation value for the blur effect.
 * @returns Object containing the unique filter id and SVG <filter> element.
 */
export function svgBlur(blur: number) {
  const id = 'blur' + generateId('');

  const filter = createSVGElement('filter');
  filter.setAttribute('id', id);

  const feGaussianBlur = createSVGElement('feGaussianBlur');
  feGaussianBlur.setAttribute('in', 'SourceGraphic');
  feGaussianBlur.setAttribute('stdDeviation', String(blur));

  addTo(filter, feGaussianBlur);

  return { id, filter };
}
