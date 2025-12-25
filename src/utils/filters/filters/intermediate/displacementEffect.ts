import { propertyUpdate, appendChildren } from '../../helpers/helpers.js';
import { createSVGElement } from '../../../../core/providers/svgSpecific.js';

import { displacementEffectProps } from '../../../../types/filters.d';
import { generateId } from '../../../helpers/helpers.js';

export function displacementEffect(props: displacementEffectProps = {}) {
  const {
    patternStyle = 'turbulence',
    waveFrequency = 0.6,
    detailLevel = 3,
    randomSeed,
    distortionAmount = 5,
    distortDirectionX = 'B',
    distortDirectionY = 'G'
  } = props;

  const id = 'displacementEffect' + generateId('');
  const filter = createSVGElement('filter');
  filter.setAttribute('id', id);

  // feTurbulence (always outputs to "turb")
  const feTurbulence = createSVGElement('feTurbulence');
  propertyUpdate(feTurbulence, {
    type: patternStyle,
    baseFrequency: waveFrequency,
    numOctaves: detailLevel,
    ...(randomSeed !== undefined ? { seed: randomSeed } : {}),
    result: 'turb'
  });

  // feDisplacementMap (always takes "SourceGraphic" and "turb")
  const feDisplacementMap = createSVGElement('feDisplacementMap');
  propertyUpdate(feDisplacementMap, {
    in: 'SourceGraphic',
    in2: 'turb',
    scale: distortionAmount,
    xChannelSelector: distortDirectionX,
    yChannelSelector: distortDirectionY
  });

  // Append
  appendChildren(filter, feTurbulence, feDisplacementMap);

  const filterComp = {
    feTurbulence,
    feDisplacementMap
  };

  return { id, filter, filterComp };
}
