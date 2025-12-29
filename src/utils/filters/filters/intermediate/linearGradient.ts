import { propertyUpdate, appendChildren } from '../../helpers/helpers.js';
import { createSVGElement } from '../../../../core/providers/svgSpecific.js';

import {
  linearGradientProps,
  GradientDirection
} from '../../../../types/filters.d';
import { generateId } from '../../../helpers/helpers.js';

export function linearGradient(props: linearGradientProps) {
  const directions: Record<
    GradientDirection,
    [string, string, string, string]
  > = {
    LR: ['0%', '0%', '100%', '0%'],
    RL: ['100%', '0%', '0%', '0%'],
    TB: ['0%', '0%', '0%', '100%'],
    BT: ['0%', '100%', '0%', '0%'],
    TLBR: ['0%', '0%', '100%', '100%'],
    BRTL: ['100%', '100%', '0%', '0%'],
    TRBL: ['100%', '0%', '0%', '100%'],
    BLTR: ['0%', '100%', '100%', '0%']
  };

  const { direction = 'LR', stops = [] } = props;
  const [x1, y1, x2, y2] = directions[direction];
  const id = `linearGradient-${direction + generateId('')}`;

  const linearGradient = createSVGElement('linearGradient');
  propertyUpdate(linearGradient, { id, x1, y1, x2, y2 });
  const filterComp: Record<string, SVGElement> = {};

  let lastOffset = 0;
  let nextExplicitIndex = 0;

  // Find first explicit offset index
  for (let i = 0; i < stops.length; i++) {
    if (stops[i]!.offset !== undefined) {
      nextExplicitIndex = i;
      break;
    }
  }

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    let offset: number;

    if (stop!.offset !== undefined) {
      offset = parseFloat(String(stop!.offset));
      lastOffset = offset;
      // Advance nextExplicitIndex
      for (let j = i + 1; j < stops.length; j++) {
        if (stops[j]!.offset !== undefined) {
          nextExplicitIndex = j;
          break;
        }
        nextExplicitIndex = stops.length; // no more explicit
      }
    } else {
      const nextOffset =
        nextExplicitIndex < stops.length
          ? parseFloat(String(stops[nextExplicitIndex]!.offset!))
          : 100;
      const gaps =
        nextExplicitIndex < stops.length
          ? nextExplicitIndex - i + 1
          : stops.length - i;
      offset = lastOffset + (nextOffset - lastOffset) / gaps;
      lastOffset = offset;
    }

    const stopEl = createSVGElement('stop');
    propertyUpdate(stopEl, {
      'stop-color': stop!.color,
      offset: `${offset}%`
    });

    appendChildren(linearGradient, stopEl);
    filterComp[`stop${i}`] = stopEl;
  }

  return { id, filter: linearGradient, filterComp };
}
