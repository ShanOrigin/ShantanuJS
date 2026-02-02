import { propertyUpdate } from '../../helpers/helpers.js';
import { generateId } from '../../../helpers/helpers.js';
import { createSVGElement } from '../../../../core/provider/svgSpecific.js';
export function blur(blur: number) {
  const id = 'blur' + generateId('');
  const filter = createSVGElement('filter');
  filter.setAttribute('id', id);

  // Gaussian blur
  const feGaussianBlur = createSVGElement('feGaussianBlur');
  propertyUpdate(feGaussianBlur, {
    in: 'SourceGraphic',
    stdDeviation: blur
  });
  filter.appendChild(feGaussianBlur);

  const filterComp = { feGaussianBlur };
  return { id, filter, filterComp };
}
