import { propertyUpdate, appendChildren } from '../../helpers/helpers.js';
import { createSVGElement } from '../../../../core/provider/svgSpecific.js';

import { glassMorphProps } from '../../../../types/filters.d';
import { generateId } from '../../../helpers/helpers.js';

export function glassMorph(props: glassMorphProps) {
  const {
    blurAmount = 10, // how strong the background blur is
    frostOpacity = 0.05, // how much white frost overlays the glass
    edgeBlur = 1.2, // how soft the inner highlight edge is
    edgeHighlightOpacity = 0.35 // brightness of the inner edge highlight
  } = props;

  const id = 'glassMorph' + generateId('');
  const filter = createSVGElement('filter');
  propertyUpdate(filter, {
    id,

    filterUnits: 'objectBoundingBox',
    primitiveUnits: 'userSpaceOnUse'
  });

  // 1) Blur background
  const bgBlur = createSVGElement('feGaussianBlur');
  propertyUpdate(bgBlur, {
    in: 'SourceGraphic',
    stdDeviation: blurAmount,
    result: 'bg-blur'
  });

  // 2) Slight color adjustment
  const bgTint = createSVGElement('feColorMatrix');
  propertyUpdate(bgTint, {
    in: 'bg-blur',
    type: 'matrix',
    values: `
      0.96 0    0    0 0
      0    0.96 0    0 0
      0    0    0.97 0 0
      0    0    0    1 0
    `,
    result: 'bg-tint'
  });

  // 3) Mask blurred background to shape
  const bgInShape = createSVGElement('feComposite');
  propertyUpdate(bgInShape, {
    in: 'bg-tint',
    in2: 'SourceAlpha',
    operator: 'in',
    result: 'bg-in-shape'
  });

  // 4) Frost overlay
  const frost = createSVGElement('feFlood');
  propertyUpdate(frost, {
    'flood-color': 'white',
    'flood-opacity': frostOpacity,
    result: 'frost'
  });

  const frostInShape = createSVGElement('feComposite');
  propertyUpdate(frostInShape, {
    in: 'frost',
    in2: 'SourceAlpha',
    operator: 'in',
    result: 'frost-in-shape'
  });

  // 5) Merge glass base
  const glassBaseMerge = createSVGElement('feMerge');
  const glassBaseNode1 = createSVGElement('feMergeNode');
  const glassBaseNode2 = createSVGElement('feMergeNode');
  propertyUpdate(glassBaseNode1, { in: 'bg-in-shape' });
  propertyUpdate(glassBaseNode2, { in: 'frost-in-shape' });
  appendChildren(glassBaseMerge, glassBaseNode1, glassBaseNode2);
  glassBaseMerge.setAttribute('result', 'glass-base');

  // 6) Inner highlight
  const edgeBlurEl = createSVGElement('feGaussianBlur');
  propertyUpdate(edgeBlurEl, {
    in: 'SourceAlpha',
    stdDeviation: edgeBlur,
    result: 'edge-blur'
  });

  const innerBand = createSVGElement('feComposite');
  propertyUpdate(innerBand, {
    in: 'edge-blur',
    in2: 'SourceAlpha',
    operator: 'arithmetic',
    k1: 0,
    k2: -1,
    k3: 1,
    k4: 0,
    result: 'inner-band'
  });

  const edgeFlood = createSVGElement('feFlood');
  propertyUpdate(edgeFlood, {
    'flood-color': 'white',
    'flood-opacity': edgeHighlightOpacity,
    result: 'edge-color'
  });

  const edgeComposite = createSVGElement('feComposite');
  propertyUpdate(edgeComposite, {
    in: 'edge-color',
    in2: 'inner-band',
    operator: 'in',
    result: 'edge-color-in'
  });

  // 7) Final merge
  const finalMerge = createSVGElement('feMerge');
  const finalNode1 = createSVGElement('feMergeNode');
  const finalNode2 = createSVGElement('feMergeNode');
  propertyUpdate(finalNode1, { in: 'glass-base' });
  propertyUpdate(finalNode2, { in: 'edge-color-in' });
  appendChildren(finalMerge, finalNode1, finalNode2);

  // Append all
  appendChildren(
    filter,
    bgBlur,
    bgTint,
    bgInShape,
    frost,
    frostInShape,
    glassBaseMerge,
    edgeBlurEl,
    innerBand,
    edgeFlood,
    edgeComposite,
    finalMerge
  );

  const filterComp = {
    bgBlur,
    bgTint,
    bgInShape,
    frost,
    frostInShape,
    glassBaseMerge,
    edgeBlurEl,
    innerBand,
    edgeFlood,
    edgeComposite,
    finalMerge
  };

  return { id, filter, filterComp };
}
