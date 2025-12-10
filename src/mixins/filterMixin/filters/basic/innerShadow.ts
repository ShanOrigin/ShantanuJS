import { propertyUpdate, appendChildren } from '../../helpers/helpers.js';
import { createSVGElement } from '../../../dom/dom.js';

import { innerShadowProps } from '../../../../types/filters.d';
import { generateId } from '../../../helpers/helpers.js';

export function innerShadow(props: innerShadowProps) {
  const { blur, offsetX, offsetY, color = 'black', opacity = 1 } = props;
  const id = 'innerShadow' + generateId('');
  const filter = createSVGElement('filter');

  propertyUpdate(filter, {
    id,
    filterUnits: 'userSpaceOnUse',
    x: '-50%',
    y: '-50%',
    width: '200%',
    height: '200%'
  });

  // blur alpha
  const feGaussianBlur = createSVGElement('feGaussianBlur');
  propertyUpdate(feGaussianBlur, {
    in: 'SourceAlpha',
    stdDeviation: blur,
    result: 'blur'
  });

  // offset blur
  const feOffset = createSVGElement('feOffset');
  propertyUpdate(feOffset, {
    in: 'blur',
    dx: offsetX,
    dy: offsetY,
    result: 'offsetBlur'
  });

  // invert alpha to keep inside
  const feCompositeInvert = createSVGElement('feComposite');
  propertyUpdate(feCompositeInvert, {
    in: 'SourceAlpha',
    in2: 'offsetBlur',
    operator: 'out',
    result: 'inverted'
  });

  // flood with color
  const feFlood = createSVGElement('feFlood');
  propertyUpdate(feFlood, {
    floodColor: color,
    floodOpacity: opacity,
    result: 'flood'
  });

  // mask flood with inverted area
  const feCompositeColor = createSVGElement('feComposite');
  propertyUpdate(feCompositeColor, {
    in: 'flood',
    in2: 'inverted',
    operator: 'in',
    result: 'innerShadow'
  });

  // merge with source
  const feMerge = createSVGElement('feMerge');
  const feMergeNode1 = createSVGElement('feMergeNode');
  const feMergeNode2 = createSVGElement('feMergeNode');
  propertyUpdate(feMergeNode1, { in: 'SourceGraphic' });
  propertyUpdate(feMergeNode2, { in: 'innerShadow' });
  appendChildren(feMerge, feMergeNode1, feMergeNode2);

  appendChildren(
    filter,
    feGaussianBlur,
    feOffset,
    feCompositeInvert,
    feFlood,
    feCompositeColor,
    feMerge
  );

  const filterComp = {
    feFlood,
    feOffset,
    feGaussianBlur,
    feCompositeInvert,
    feCompositeColor,
    feMerge
  };

  return { id, filter, filterComp };
}
