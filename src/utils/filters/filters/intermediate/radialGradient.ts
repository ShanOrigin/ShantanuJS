import { propertyUpdate, appendChildren } from '../../helpers/helpers.js';
import { createSVGElement } from '../../../../core/providers/svgSpecific.js';

import {
  radialGradientProps,
  RadialPosition
} from '../../../../types/filters.d';
import { generateId } from '../../../helpers/helpers.js';

export function radialGradient(props: radialGradientProps) {
  const positions: Record<RadialPosition, [string, string]> = {
    CENTER: ['50%', '50%'],
    TL: ['0%', '0%'],
    TR: ['100%', '0%'],
    BL: ['0%', '100%'],
    BR: ['100%', '100%']
  };

  let {
    direction = 'CENTER',
    radius = 50,
    focalX = 50,
    focalY = 50,
    stops = []
  } = props;

  radius = Math.abs(radius);
  focalX = Math.abs(focalX);
  focalY = Math.abs(focalY);

  const [cx, cy] = positions[direction];
  const id = `radialGradient-${direction + generateId('')}`;

  const gradient = createSVGElement('radialGradient');

  direction == 'BR' &&
    (focalX < 30 && (focalX = 30), focalY < 30 && (focalY = 30));

  direction == 'TR' &&
    (focalX < 50 && (focalX = 50), focalY > 80 && (focalY = 80));

  direction == 'CENTER' &&
    ((focalX < 30 || focalX > 70) && (focalX = 50),
    focalY > 90 && (focalY = 80));

  propertyUpdate(gradient, {
    id,
    cx,
    cy,
    //    r: typeof radius === 'number' ? `${radius}%` : radius,
    r: (direction === 'CENTER' && `${radius}%`) || '100%',
    fx: typeof focalX === 'number' ? `${focalX}%` : focalX,
    fy: typeof focalY === 'number' ? `${focalY}%` : focalY,
    gradientUnits: 'objectBoundingBox'
  });

  const filterComp: Record<string, SVGElement> = {};

  const total = stops.length;
  if (!total) return { id, filter: gradient, filterComp };

  // Pass 1: gather explicit offsets
  let firstExplicit = -1;
  let lastExplicit = -1;
  for (let i = 0; i < total; i++) {
    if (stops[i].offset !== undefined) {
      if (firstExplicit === -1) firstExplicit = i;
      lastExplicit = i;
    }
  }

  // Pass 2: compute offsets
  for (let i = 0; i < total; i++) {
    const stop = stops[i];
    let offset: number;

    if (stop.offset !== undefined) {
      offset = parseFloat(String(stop.offset));
    } else {
      if (firstExplicit === -1) {
        // no explicit offsets at all
        offset = (i / (total - 1)) * 100;
      } else if (i < firstExplicit) {
        // before first explicit
        offset =
          (i / firstExplicit) *
          parseFloat(String(stops[firstExplicit].offset!));
      } else if (i > lastExplicit) {
        // after last explicit
        offset =
          parseFloat(String(stops[lastExplicit].offset!)) +
          ((i - lastExplicit) / (total - 1 - lastExplicit)) *
            (100 - parseFloat(String(stops[lastExplicit].offset!)));
      } else {
        // between two explicit stops
        let nextExplicit = i + 1;
        while (nextExplicit < total && stops[nextExplicit].offset === undefined)
          nextExplicit++;

        const prevOffset = parseFloat(String(stops[i - 1].offset!));
        const nextOffset =
          nextExplicit < total
            ? parseFloat(String(stops[nextExplicit].offset!))
            : 100;

        const gap = nextExplicit - (i - 1);
        offset = prevOffset + (nextOffset - prevOffset) / gap;
        stops[i].offset = offset; // cache it to reuse if needed
      }
    }

    const stopEl = createSVGElement('stop');
    propertyUpdate(stopEl, {
      'stop-color': stop.color,
      offset: `${offset}%`
    });

    appendChildren(gradient, stopEl);
    filterComp[`stop${i}`] = stopEl;
  }

  return { id, filter: gradient, filterComp };
}
