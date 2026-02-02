import { propertyUpdate, appendChildren } from '../../helpers/helpers.js';
import { createSVGElement } from '../../../../core/provider/svgSpecific.js';

import { colorMatrixProps } from '../../../../types/filters.d';
import { generateId } from '../../../helpers/helpers.js';

interface colorMatrixPropsWithSVG extends colorMatrixProps {
  filter?: SVGElement;
  filterComp?: object;
}

export function colorMatrixTransformation(props: colorMatrixPropsWithSVG) {
  const { type, values, inSource = 'SourceGraphic' } = props;

  const id = 'colorMatrix' + generateId('');
  props.filter = createSVGElement('filter');
  props.filter.setAttribute('id', id);

  const feColorMatrix = createSVGElement('feColorMatrix');
  propertyUpdate(feColorMatrix, {
    type,
    in: inSource,
    result: 'colorMatrixResult'
  });

  // Handle values
  if (type === 'matrix' && Array.isArray(values)) {
    feColorMatrix.setAttribute('values', values.join(' '));
  } else if (
    (type === 'saturate' || type === 'hueRotate') &&
    typeof values === 'number'
  ) {
    feColorMatrix.setAttribute('values', String(values));
  }

  appendChildren(props.filter, feColorMatrix);

  props.filterComp = { feColorMatrix };
  return id;
}
