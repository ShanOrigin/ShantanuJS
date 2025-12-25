import { propertyUpdate, appendChildren } from '../../helpers/helpers.js';
import { createSVGElement } from '../../../../core/providers/svgSpecific.js';

import { neuMorphProps } from '../../../../types/filters.d';
import { generateId } from '../../../helpers/helpers.js';
function outerNeu(props: Partial<neuMorphProps>) {
  const {
    // colors
    outerShadowColor = '#b8c9db',
    highlightColor = '#ffffff',

    // outer shadow
    outerBlur = 10,
    outerOffsetX = 8,
    outerOffsetY = 8,
    outerShadowOpacity = 0.85,

    // highlight (top-left)
    highlightBlur = 6,
    highlightOffsetX = -6,
    highlightOffsetY = -6,
    highlightOpacity = 0.9
  } = props;

  const blur1Outer = createSVGElement('feGaussianBlur');
  propertyUpdate(blur1Outer, {
    in: 'SourceAlpha',
    stdDeviation: outerBlur,
    result: 'blur'
  });

  const offset1Outer = createSVGElement('feOffset');
  propertyUpdate(offset1Outer, {
    dx: outerOffsetX,
    dy: outerOffsetY,
    result: 'offset'
  });

  const flood1Outer = createSVGElement('feFlood');
  propertyUpdate(flood1Outer, {
    'flood-color': outerShadowColor,
    'flood-opacity': outerShadowOpacity,
    result: 'flood'
  });

  const comp1Outer = createSVGElement('feComposite');
  propertyUpdate(comp1Outer, {
    in: 'flood',
    in2: 'offset',
    operator: 'in',
    result: 'shadow1'
  });

  // Highlight (top-left)
  const blur2Outer = createSVGElement('feGaussianBlur');
  propertyUpdate(blur2Outer, {
    in: 'SourceAlpha',
    stdDeviation: highlightBlur,
    result: 'blur2'
  });

  const offset2Outer = createSVGElement('feOffset');
  propertyUpdate(offset2Outer, {
    dx: highlightOffsetX,
    dy: highlightOffsetY,
    result: 'offset2'
  });

  const flood2Outer = createSVGElement('feFlood');
  propertyUpdate(flood2Outer, {
    'flood-color': highlightColor,
    'flood-opacity': highlightOpacity,
    result: 'flood2'
  });

  const comp2Outer = createSVGElement('feComposite');
  propertyUpdate(comp2Outer, {
    in: 'flood2',
    in2: 'offset2',
    operator: 'in',
    result: 'shadow2'
  });

  const mergeOuter = createSVGElement('feMerge');

  propertyUpdate(mergeOuter, {
    result: 'outerMorph'
  });

  const mergeNode1 = createSVGElement('feMergeNode');
  const mergeNode2 = createSVGElement('feMergeNode');
  const mergeNode3 = createSVGElement('feMergeNode');

  propertyUpdate(mergeNode1, { in: 'shadow1' });
  propertyUpdate(mergeNode2, { in: 'shadow2' });
  propertyUpdate(mergeNode3, { in: 'SourceGraphic' });

  appendChildren(mergeOuter, mergeNode1, mergeNode2, mergeNode3);
  const filterComp = {
    blur1Outer,
    offset1Outer,
    flood1Outer,
    comp1Outer,
    blur2Outer,
    offset2Outer,
    flood2Outer,
    comp2Outer,
    mergeOuter
  };

  return filterComp;
}

function innerNeu(props: Partial<neuMorphProps>) {
  const {
    innerShadowColor = '#000000',

    // inner shadow
    innerBlur = 6,
    innerOffsetX = 4,
    innerOffsetY = 4,
    innerShadowOpacity = 0.12
  } = props;

  const blurInner = createSVGElement('feGaussianBlur');
  propertyUpdate(blurInner, {
    in: 'SourceAlpha',
    stdDeviation: innerBlur,
    result: 'blurInner'
  });

  const offsetInner = createSVGElement('feOffset');
  propertyUpdate(offsetInner, {
    dx: innerOffsetX,
    dy: innerOffsetY,
    result: 'offsetInner'
  });

  const compInner = createSVGElement('feComposite');
  propertyUpdate(compInner, {
    in: 'SourceGraphic',
    in2: 'offsetInner',
    operator: 'arithmetic',
    k1: '0',
    k2: '-1',
    k3: '1',
    k4: '0',
    result: 'insetMask'
  });

  const floodInner = createSVGElement('feFlood');
  propertyUpdate(floodInner, {
    'flood-color': innerShadowColor,
    'flood-opacity': innerShadowOpacity,
    result: 'insetColor'
  });

  const compInner2 = createSVGElement('feComposite');
  propertyUpdate(compInner2, {
    in: 'insetColor',
    in2: 'insetMask',
    operator: 'in',
    result: 'insetShadow'
  });

  const mergeInner = createSVGElement('feMerge');

  const mergeNode0 = createSVGElement('feMergeNode');
  const mergeNode1 = createSVGElement('feMergeNode');
  const mergeNode2 = createSVGElement('feMergeNode');

  propertyUpdate(mergeNode0, { in: 'outerMorph' });
  propertyUpdate(mergeNode1, { in: 'insetShadow' });
  propertyUpdate(mergeNode2, { in: 'SourceGraphic' });

  appendChildren(mergeInner, mergeNode0, mergeNode1, mergeNode2);

  const filterComp = {
    blurInner,
    offsetInner,
    compInner,
    floodInner,
    compInner2,
    mergeInner
  };

  return filterComp;
}

export function neuMorph(props: neuMorphProps) {
  const { type = 'full' } = props;

  const id = `${type}-neuMorph-` + generateId('');
  let filterComp = {};
  const filter = createSVGElement('filter');
  propertyUpdate(filter, {
    id,
    x: '-50%',
    y: '-50%',
    width: '200%',
    height: '200%',
    filterUnits: 'objectBoundingBox'
  });

  // ==========================
  // OUTER NEUMORPH
  // ==========================
  if (type === 'outer' || type === 'full') {
    const figCom = outerNeu(props);

    appendChildren(
      filter,
      figCom.blur1Outer,
      figCom.offset1Outer,
      figCom.flood1Outer,
      figCom.comp1Outer,
      figCom.blur2Outer,
      figCom.offset2Outer,
      figCom.flood2Outer,
      figCom.comp2Outer,
      figCom.mergeOuter
    );

    filterComp = figCom;
  }

  // ==========================
  // INNER NEUMORPH
  // ==========================
  if (type === 'inner' || type === 'full') {
    const figCom = innerNeu(props);

    appendChildren(
      filter,
      figCom.blurInner,
      figCom.offsetInner,
      figCom.compInner,
      figCom.floodInner,
      figCom.compInner2,
      figCom.mergeInner
    );

    filterComp = {
      ...filterComp,
      ...figCom
    };
  }

  return { id, filter, filterComp };
}
