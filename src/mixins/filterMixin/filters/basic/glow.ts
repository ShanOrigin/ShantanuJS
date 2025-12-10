import { propertyUpdate, appendChildren } from '../../helpers/helpers.js';
import { createSVGElement } from '../../../dom/dom.js';
import { generateId } from '../../../helpers/helpers.js';

export function glow(bright: number) {
  const id = 'glow' + generateId('');
  const filter = createSVGElement('filter');
  filter.setAttribute('id', id);

  // Gaussian blur
  const feGaussianBlur = createSVGElement('feGaussianBlur');
  propertyUpdate(feGaussianBlur, {
    in: 'SourceGraphic',
    stdDeviation: bright
  });

  // Merge
  const feMerge = createSVGElement('feMerge');
  const feMergeNode0 = createSVGElement('feMergeNode');
  const feMergeNode1 = createSVGElement('feMergeNode');
  feMergeNode0.setAttribute('in', 'coloredBlur');
  feMergeNode1.setAttribute('in', 'SourceGraphic');

  // 🔹 Append chain using helper
  appendChildren(feMerge, feMergeNode0, feMergeNode1);
  appendChildren(filter, feGaussianBlur, feMerge);

  const filterComp = {
    feGaussianBlur,
    feMerge,
    feMergeNode0,
    feMergeNode1
  };
  return { id, filter, filterComp };
}
