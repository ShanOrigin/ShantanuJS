import { propertyUpdate, appendChildren } from '../../helpers/helpers.js';
import { createSVGElement } from '../../../../core/provider/svgSpecific.js';

import { lightEffectProps } from '../../../../types/filters.d';
import { generateId } from '../../../helpers/helpers.js';

export function lightEffect(props: lightEffectProps) {
  const {
    lightingColor = 'red',
    surfaceScale = 1,
    intensityOfLight = 1,
    horizontalAngleOfLight = 45,
    verticalAngleOfLight = 45
  } = props;

  const id = 'lightEffect' + generateId('');
  const filter = createSVGElement('filter');
  filter.setAttribute('id', id);

  // feDiffuseLighting
  const feDiffuseLighting = createSVGElement('feDiffuseLighting');
  propertyUpdate(feDiffuseLighting, {
    in: 'SourceGraphic',
    'lighting-color': lightingColor,
    surfaceScale,
    diffuseConstant: intensityOfLight
  });

  // feDistantLight
  const feDistantLight = createSVGElement('feDistantLight');
  propertyUpdate(feDistantLight, {
    azimuth: horizontalAngleOfLight,
    elevation: verticalAngleOfLight
  });

  // Append
  appendChildren(feDiffuseLighting, feDistantLight);
  appendChildren(filter, feDiffuseLighting);

  const filterComp = {
    feDiffuseLighting,
    feDistantLight
  };

  return { id, filter, filterComp };
}
