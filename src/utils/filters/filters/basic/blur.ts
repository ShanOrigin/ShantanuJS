import { propertyUpdate } from '../../helpers/helpers.js';
import { createSVGElement } from '../../../dom/dom.js';
import { generateId } from '../../../helpers/helpers.js';

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
